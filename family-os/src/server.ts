import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createState, type State } from "./core/state.ts";
import { fixedClock, systemClock, resetIds, dateOf } from "./core/time.ts";
import { seedHousehold } from "./demo/household.ts";
import { demoInbox, DEMO_NOW } from "./demo/inbox.ts";
import { ingest, decide, trustSummary, setExecuteHook } from "./orchestrator.ts";
import { composeBrief } from "./agents/brief.ts";
import { setLevel } from "./core/trust.ts";
import { llmConfigured } from "./llm/adapter.ts";
import { geminiConfig, geminiReady, ping, writeConfigFile } from "./llm/gemini.ts";
import { loadState, saveState, clearState } from "./core/store.ts";
import { balance, earnedThisWeek, streak, isDue, complete, undo, claim } from "./core/chores.ts";
import { draftHousehold, draftToHousehold, suggestPolicies, SAMPLE_INTRO, type HouseholdDraft } from "./onboarding.ts";
import { fetchIcs, importIcsText } from "./connectors/ics.ts";
import { googleConfigured, googleConnected, authUrl, exchangeCode, gmailSync, gcalInsert, disconnectGoogle } from "./connectors/google.ts";
import { briefScript, briefAudio } from "./podcast.ts";
import type { ActionClass, CalendarEvent, RawMessage, TrustLevel } from "./core/types.ts";

const PORT = Number(process.env.PORT ?? 5100);
const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "web");
const BASE = process.env.FAMILY_OS_BASE_URL ?? `http://localhost:${PORT}`;

let state: State;

function clockFor(demo: boolean) {
  return demo && process.env.FAMILY_OS_LIVE !== "1" ? fixedClock(DEMO_NOW) : systemClock();
}

async function bootDemo(runDemo: boolean): Promise<void> {
  resetIds();
  state = createState(seedHousehold(), clockFor(true));
  state.connections.demo = true;
  state.connections.onboarded = true;
  if (runDemo) for (const raw of demoInbox) await ingest(state, raw, { useLlm: geminiReady() });
  saveState(state);
}

function persist(): void {
  saveState(state);
}

// Calendar write-back once Google is connected. Best effort; never blocks the brief.
setExecuteHook((s, a, signalId) => {
  if (a.cls !== "calendar_write" || !googleConnected()) return;
  const p = a.payload ?? {};
  const ev = p.op === "add" ? (p.event as CalendarEvent) : s.calendar.find((e) => e.id === p.eventId);
  if (!ev) return;
  gcalInsert(ev, s.household.timezone, `Added by Family OS from ${s.signals.find((x) => x.id === signalId)?.raw.from ?? "a message"}`)
    .then(() => {
      s.connections.gcal = { calendarId: "primary", lastWrite: s.clock.now() };
      persist();
    })
    .catch((err) => console.warn(`[gcal] write failed: ${(err as Error).message}`));
});

function snapshot() {
  const day = dateOf(state.clock.now());
  const kids = state.household.people.filter((p) => p.role === "child");
  return {
    now: state.clock.now(),
    llm: llmConfigured(),
    config: { geminiReady: geminiReady(), model: geminiConfig().model, googleConfigured: googleConfigured(), googleConnected: googleConnected(), baseUrl: BASE },
    onboarded: !!state.connections.onboarded,
    demo: !!state.connections.demo,
    household: state.household,
    trust: trustSummary(state),
    brief: composeBrief(state),
    calendar: [...state.calendar].sort((a, b) => a.start.localeCompare(b.start)),
    reminders: [...state.reminders].sort((a, b) => a.at.localeCompare(b.at)),
    ledger: state.ledger,
    proposals: state.proposals,
    signals: state.signals,
    trace: state.trace,
    drafts: state.drafts,
    spend: state.spend,
    connections: state.connections,
    chores: {
      board: state.chores,
      perChild: kids.map((k) => ({
        childId: k.id,
        name: k.name,
        balance: balance(state.chores, k.id),
        week: earnedThisWeek(state.chores, k.id, day),
        streak: streak(state.chores, k.id, day),
        due: state.chores.chores.filter((c) => c.childId === k.id && isDue(c, day)).map((c) => c.id),
        doneToday: state.chores.chores.filter((c) => c.childId === k.id && c.doneOn.includes(day)).map((c) => c.id),
      })),
    },
    samples: demoInbox,
  };
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2" };

async function api(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
  const p = url.pathname;
  const post = req.method === "POST";
  if (!post && p === "/api/state") return json(res, 200, snapshot());

  // ── Inbox & decisions ─────────────────────────────────────────────
  if (post && p === "/api/inbox") {
    const b = await readBody(req);
    const raw: RawMessage = { channel: (b.channel as RawMessage["channel"]) ?? "manual", from: String(b.from ?? "unknown"), subject: b.subject ? String(b.subject) : undefined, body: String(b.body ?? "") };
    if (!raw.body.trim()) return json(res, 400, { error: "Paste or forward something first." });
    const r = await ingest(state, raw, { useLlm: geminiReady() && b.useLlm !== false });
    persist();
    return json(res, 200, { result: r, state: snapshot() });
  }
  if (post && p === "/api/decide") {
    const b = await readBody(req);
    const entry = decide(state, String(b.ledgerId), b.kind as "approve" | "decline" | "snooze", typeof b.alternativeIndex === "number" ? b.alternativeIndex : undefined);
    persist();
    return json(res, 200, { entry, state: snapshot() });
  }
  if (post && p === "/api/trust") {
    const b = await readBody(req);
    if (b.preset) applyPreset(String(b.preset));
    else {
      setLevel(state.trust, b.cls as ActionClass, Number(b.level) as TrustLevel, typeof b.pinned === "boolean" ? b.pinned : undefined);
      state.promotionsOffered = state.promotionsOffered.filter((c) => c !== b.cls);
    }
    persist();
    return json(res, 200, { state: snapshot() });
  }
  if (post && p === "/api/policy") {
    const b = await readBody(req);
    const pol = state.household.policies.find((x) => x.id === b.id);
    if (!pol) return json(res, 404, { error: "No such rule." });
    if (typeof b.enabled === "boolean") pol.enabled = b.enabled;
    if (b.params && typeof b.params === "object") pol.params = { ...pol.params, ...(b.params as Record<string, unknown>) };
    persist();
    return json(res, 200, { state: snapshot() });
  }
  if (post && p === "/api/demo/reset") {
    const b = await readBody(req);
    clearState();
    await bootDemo(b.runDemo !== false);
    return json(res, 200, { state: snapshot() });
  }

  // ── Onboarding & config ───────────────────────────────────────────
  if (!post && p === "/api/onboard/sample") return json(res, 200, { text: SAMPLE_INTRO });
  if (post && p === "/api/onboard/draft") {
    const b = await readBody(req);
    const text = String(b.text ?? "").trim();
    if (text.length < 20) return json(res, 400, { error: "Tell me a little more: names, ages, school, the regular activities." });
    const d = await draftHousehold(text);
    return json(res, 200, d);
  }
  if (post && p === "/api/onboard/policies") {
    const b = await readBody(req);
    return json(res, 200, { policies: suggestPolicies(b.draft as HouseholdDraft) });
  }
  if (post && p === "/api/onboard/commit") {
    const b = await readBody(req);
    const draft = b.draft as HouseholdDraft;
    if (!draft?.children?.length && !draft?.adults?.length) return json(res, 400, { error: "I need at least one person to set up the household." });
    resetIds();
    const household = draftToHousehold(draft);
    if (Array.isArray(b.disabledPolicies)) for (const id of b.disabledPolicies as string[]) { const pol = household.policies.find((x) => x.id === id); if (pol) pol.enabled = false; }
    state = createState(household, clockFor(false));
    state.connections.onboarded = true;
    state.connections.demo = false;
    if (b.trustPreset) applyPreset(String(b.trustPreset));
    persist();
    return json(res, 200, { state: snapshot() });
  }
  if (post && p === "/api/onboard/demo") {
    clearState();
    await bootDemo(true);
    return json(res, 200, { state: snapshot() });
  }
  if (post && p === "/api/config") {
    const b = await readBody(req);
    const patch: Record<string, unknown> = {};
    if (typeof b.geminiKey === "string") patch.geminiKey = b.geminiKey.trim() || undefined;
    if (typeof b.geminiModel === "string" && b.geminiModel.trim()) patch.geminiModel = b.geminiModel.trim();
    if (typeof b.googleClientId === "string") patch.googleClientId = b.googleClientId.trim() || undefined;
    if (typeof b.googleClientSecret === "string") patch.googleClientSecret = b.googleClientSecret.trim() || undefined;
    writeConfigFile(patch);
    return json(res, 200, { config: snapshot().config });
  }
  if (!post && p === "/api/gemini/ping") return json(res, 200, await ping());

  // ── Connections ───────────────────────────────────────────────────
  if (post && p === "/api/connect/ics") {
    const b = await readBody(req);
    const url = String(b.url ?? "").trim();
    if (!/^(https?|webcal):\/\//i.test(url)) return json(res, 400, { error: "That does not look like a calendar link. It usually starts with https:// or webcal://." });
    try {
      const text = await fetchIcs(url);
      const r = importIcsText(state, text, { url, label: String(b.label ?? "calendar"), childId: b.childId ? String(b.childId) : undefined });
      persist();
      return json(res, 200, { ...r, state: snapshot() });
    } catch (err) {
      return json(res, 502, { error: (err as Error).message });
    }
  }
  if (post && p === "/api/connect/whatsapp") {
    const b = await readBody(req);
    state.connections.whatsapp = { number: String(b.number ?? "") };
    persist();
    return json(res, 200, { state: snapshot() });
  }
  if (post && p === "/api/connect/gmail/sync") {
    if (!googleConnected()) return json(res, 400, { error: "Connect Google first." });
    const b = await readBody(req);
    try {
      const r = await gmailSync(state, (raw) => ingest(state, raw, { useLlm: geminiReady() }), { query: b.query ? String(b.query) : undefined, max: typeof b.max === "number" ? b.max : undefined });
      persist();
      return json(res, 200, { ...r, state: snapshot() });
    } catch (err) {
      return json(res, 502, { error: (err as Error).message });
    }
  }
  if (post && p === "/api/connect/google/disconnect") {
    disconnectGoogle();
    delete state.connections.gmail;
    delete state.connections.gcal;
    persist();
    return json(res, 200, { state: snapshot() });
  }

  // ── Chores ────────────────────────────────────────────────────────
  if (post && p.startsWith("/api/chores/")) {
    const b = await readBody(req);
    const op = p.slice("/api/chores/".length);
    if (op === "complete") complete(state.chores, state.clock, String(b.choreId));
    else if (op === "undo") undo(state.chores, String(b.choreId), String(b.day ?? dateOf(state.clock.now())));
    else if (op === "add") state.chores.chores.push({ id: `ch_${Date.now().toString(36)}`, childId: String(b.childId), title: String(b.title), points: Number(b.points ?? 5), cadence: (b.cadence as "daily" | "weekly" | "once") ?? "daily", doneOn: [], source: "family" });
    else if (op === "remove") state.chores.chores = state.chores.chores.filter((c) => c.id !== b.choreId);
    else if (op === "claim") { const c = claim(state.chores, state.clock, String(b.childId), String(b.rewardId)); if (!c) return json(res, 400, { error: "Not enough points yet." }); }
    else if (op === "approve") { const c = state.chores.claims.find((x) => x.id === b.claimId); if (c) c.approved = true; }
    else if (op === "reward") state.chores.rewards.push({ id: `rw_${Date.now().toString(36)}`, title: String(b.title), cost: Number(b.cost ?? 30) });
    else return json(res, 404, { error: "Unknown chores action." });
    persist();
    return json(res, 200, { state: snapshot() });
  }

  // ── Podcast ───────────────────────────────────────────────────────
  if (!post && p === "/api/brief/script") return json(res, 200, await briefScript(state, composeBrief(state)));
  if (!post && p === "/api/brief/audio.wav") {
    if (!geminiReady()) return json(res, 501, { error: "Add a Gemini key for a spoken brief; the browser voice works meanwhile." });
    try {
      const { script } = await briefScript(state, composeBrief(state));
      const wav = await briefAudio(script);
      res.writeHead(200, { "content-type": "audio/wav", "cache-control": "no-store" });
      return void res.end(wav);
    } catch (err) {
      return json(res, 502, { error: (err as Error).message });
    }
  }
  return json(res, 404, { error: "Not found." });
}

function applyPreset(preset: string): void {
  const map: Record<string, Partial<Record<ActionClass, TrustLevel>>> = {
    cautious: { calendar_write: 2, reminder: 3, sign_form: 2, payment: 1, outbound_message: 1, coparent_reply: 1, purchase: 1, enrolment: 1 },
    balanced: { calendar_write: 3, reminder: 4, sign_form: 2, payment: 2, outbound_message: 2, coparent_reply: 1, purchase: 2, enrolment: 1 },
    "hands-off": { calendar_write: 4, reminder: 4, sign_form: 2, payment: 3, outbound_message: 3, coparent_reply: 1, purchase: 2, enrolment: 2 },
  };
  const levels = map[preset];
  if (!levels) return;
  for (const [cls, level] of Object.entries(levels) as [ActionClass, TrustLevel][]) setLevel(state.trust, cls, level, cls === "sign_form" ? true : undefined);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname === "/oauth/google/start") {
      if (!googleConfigured()) return json(res, 400, { error: "Add a Google OAuth client id and secret in Settings first." });
      res.writeHead(302, { location: authUrl(`${BASE}/oauth/google/callback`) });
      return res.end();
    }
    if (url.pathname === "/oauth/google/callback") {
      const code = url.searchParams.get("code");
      if (!code) return json(res, 400, { error: url.searchParams.get("error") ?? "No code" });
      await exchangeCode(code, `${BASE}/oauth/google/callback`);
      res.writeHead(302, { location: "/?connected=google#settings" });
      return res.end();
    }
    const routes: Record<string, string> = { "/": "index.html", "/welcome": "welcome.html", "/wall": "wall.html", "/kids": "index.html" };
    const file = routes[url.pathname] ?? url.pathname.slice(1);
    const full = path.join(WEB, path.normalize(file));
    if (!full.startsWith(WEB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(full)] ?? "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(full).pipe(res);
  } catch (err) {
    console.error(err);
    json(res, 500, { error: (err as Error).message });
  }
});

const loaded = loadState(systemClock());
if (loaded) {
  state = loaded;
  state.clock = clockFor(!!state.connections.demo);
  console.log(`restored ${state.household.name} from data/state.json`);
} else {
  await bootDemo(true);
}
server.listen(PORT, () => {
  console.log(`family-os on ${BASE}  (gemini: ${geminiReady() ? geminiConfig().model : "no key yet"}, google: ${googleConnected() ? "connected" : googleConfigured() ? "configured" : "not configured"})`);
});
