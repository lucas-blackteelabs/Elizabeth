import type { State } from "../core/state.ts";
import type { CalendarEvent, RawMessage } from "../core/types.ts";
import { readConfigFile, writeConfigFile } from "../llm/gemini.ts";

/**
 * Gmail (read) and Google Calendar (write) over plain REST with an OAuth
 * loopback flow. Needs a Google Cloud OAuth client of type "Web application"
 * with the redirect URI http://localhost:<port>/oauth/google/callback, and the
 * Gmail API + Calendar API enabled on that project.
 *
 *   GOOGLE_OAUTH_CLIENT_ID=...  GOOGLE_OAUTH_CLIENT_SECRET=...  npm run dev
 *
 * Tokens are stored in data/config.json, which is git-ignored.
 */

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.email"];

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

function client(): { id?: string; secret?: string } {
  const file = readConfigFile();
  return {
    id: process.env.GOOGLE_OAUTH_CLIENT_ID || (file.googleClientId as string | undefined),
    secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || (file.googleClientSecret as string | undefined),
  };
}

export function googleConfigured(): boolean {
  const c = client();
  return !!(c.id && c.secret);
}

export function googleConnected(): boolean {
  return !!(readConfigFile().googleTokens as Tokens | undefined)?.refresh_token;
}

export function authUrl(redirectUri: string): string {
  const c = client();
  const q = new URLSearchParams({ client_id: c.id ?? "", redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true" });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<void> {
  const c = client();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: c.id ?? "", client_secret: c.secret ?? "", redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const t = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  const prev = readConfigFile().googleTokens as Tokens | undefined;
  writeConfigFile({ googleTokens: { access_token: t.access_token, refresh_token: t.refresh_token ?? prev?.refresh_token, expires_at: Date.now() + (t.expires_in - 60) * 1000 } });
}

export function disconnectGoogle(): void {
  writeConfigFile({ googleTokens: undefined });
}

async function accessToken(): Promise<string> {
  const t = readConfigFile().googleTokens as Tokens | undefined;
  if (!t?.refresh_token) throw new Error("Google is not connected");
  if (t.access_token && Date.now() < t.expires_at) return t.access_token;
  const c = client();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: t.refresh_token, client_id: c.id ?? "", client_secret: c.secret ?? "", grant_type: "refresh_token" }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const n = (await res.json()) as { access_token: string; expires_in: number };
  writeConfigFile({ googleTokens: { ...t, access_token: n.access_token, expires_at: Date.now() + (n.expires_in - 60) * 1000 } });
  return n.access_token;
}

async function g<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(url, { ...init, headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export async function profile(): Promise<{ email: string }> {
  const p = await g<{ emailAddress: string }>("https://gmail.googleapis.com/gmail/v1/users/me/profile");
  return { email: p.emailAddress };
}

interface GmailMessage {
  id: string;
  internalDate: string;
  payload: { headers: { name: string; value: string }[]; mimeType: string; body?: { data?: string }; parts?: GmailMessage["payload"][] };
}

function decode(data?: string): string {
  return data ? Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8") : "";
}

function bodyOf(p: GmailMessage["payload"]): string {
  if (p.mimeType === "text/plain" && p.body?.data) return decode(p.body.data);
  if (p.parts) {
    const plain = p.parts.map(bodyOf).find((t) => t.trim());
    if (plain) return plain;
  }
  if (p.mimeType === "text/html" && p.body?.data) return stripHtml(decode(p.body.data));
  return "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pull recent mail and hand each message to the pipeline. Skips what has already been processed. */
export async function gmailSync(state: State, ingest: (raw: RawMessage) => Promise<unknown>, opts: { query?: string; max?: number } = {}): Promise<{ ingested: number; skipped: number; email: string }> {
  const email = (await profile()).email;
  const conn = (state.connections.gmail ??= { email, processedIds: [] });
  conn.email = email;
  const q = opts.query ?? "newer_than:14d -category:promotions -category:social -in:spam";
  const list = await g<{ messages?: { id: string }[] }>(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${opts.max ?? 25}&q=${encodeURIComponent(q)}`);
  let ingested = 0;
  let skipped = 0;
  for (const m of list.messages ?? []) {
    if (conn.processedIds.includes(m.id)) {
      skipped += 1;
      continue;
    }
    const full = await g<GmailMessage>(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`);
    const h = (n: string) => full.payload.headers.find((x) => x.name.toLowerCase() === n)?.value ?? "";
    const body = bodyOf(full.payload).slice(0, 6000);
    if (!body.trim()) {
      conn.processedIds.push(m.id);
      skipped += 1;
      continue;
    }
    await ingest({ channel: "email", from: h("from"), subject: h("subject"), body });
    conn.processedIds.push(m.id);
    ingested += 1;
  }
  conn.lastSync = state.clock.now();
  conn.processedIds = conn.processedIds.slice(-500);
  return { ingested, skipped, email };
}

/** Write an event to the primary Google Calendar. Returns the event id. */
export async function gcalInsert(ev: CalendarEvent, timeZone: string, description?: string): Promise<string> {
  const body = {
    summary: ev.title,
    location: ev.locationText,
    description,
    start: { dateTime: `${ev.start}:00`, timeZone },
    end: { dateTime: `${ev.end}:00`, timeZone },
  };
  const r = await g<{ id: string }>("https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return r.id;
}
