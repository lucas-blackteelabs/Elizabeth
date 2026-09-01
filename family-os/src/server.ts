import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createState, type State } from "./core/state.ts";
import { fixedClock, systemClock, resetIds } from "./core/time.ts";
import { seedHousehold } from "./demo/household.ts";
import { demoInbox, DEMO_NOW } from "./demo/inbox.ts";
import { ingest, decide, trustSummary } from "./orchestrator.ts";
import { composeBrief } from "./agents/brief.ts";
import { setLevel } from "./core/trust.ts";
import { llmConfigured } from "./llm/adapter.ts";
import type { ActionClass, RawMessage, TrustLevel } from "./core/types.ts";

const PORT = Number(process.env.PORT ?? 5100);
const LIVE = process.env.FAMILY_OS_LIVE === "1";
const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "web");

let state: State;
async function reset(runDemo: boolean): Promise<void> {
  resetIds();
  state = createState(seedHousehold(), LIVE ? systemClock() : fixedClock(DEMO_NOW));
  if (runDemo) for (const raw of demoInbox) await ingest(state, raw, { useLlm: !!llmConfigured() });
}

function snapshot() {
  return {
    now: state.clock.now(),
    llm: llmConfigured(),
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

const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, snapshot());
      if (req.method === "POST" && url.pathname === "/api/inbox") {
        const b = await readBody(req);
        const raw: RawMessage = { channel: (b.channel as RawMessage["channel"]) ?? "manual", from: String(b.from ?? "unknown"), subject: b.subject ? String(b.subject) : undefined, body: String(b.body ?? "") };
        if (!raw.body.trim()) return json(res, 400, { error: "body is required" });
        const r = await ingest(state, raw, { useLlm: !!llmConfigured() && b.useLlm !== false });
        return json(res, 200, { result: r, state: snapshot() });
      }
      if (req.method === "POST" && url.pathname === "/api/decide") {
        const b = await readBody(req);
        const entry = decide(state, String(b.ledgerId), b.kind as "approve" | "decline" | "snooze", typeof b.alternativeIndex === "number" ? b.alternativeIndex : undefined);
        return json(res, 200, { entry, state: snapshot() });
      }
      if (req.method === "POST" && url.pathname === "/api/trust") {
        const b = await readBody(req);
        setLevel(state.trust, b.cls as ActionClass, Number(b.level) as TrustLevel, typeof b.pinned === "boolean" ? b.pinned : undefined);
        state.promotionsOffered = state.promotionsOffered.filter((c) => c !== b.cls);
        return json(res, 200, { state: snapshot() });
      }
      if (req.method === "POST" && url.pathname === "/api/policy") {
        const b = await readBody(req);
        const p = state.household.policies.find((p) => p.id === b.id);
        if (!p) return json(res, 404, { error: "no such policy" });
        p.enabled = !!b.enabled;
        return json(res, 200, { state: snapshot() });
      }
      if (req.method === "POST" && url.pathname === "/api/demo/reset") {
        const b = await readBody(req);
        await reset(b.runDemo !== false);
        return json(res, 200, { state: snapshot() });
      }
      return json(res, 404, { error: "not found" });
    }
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
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

await reset(true);
server.listen(PORT, () => {
  console.log(`family-os command center on http://localhost:${PORT}  (clock: ${LIVE ? "live" : DEMO_NOW}, llm: ${llmConfigured() ?? "rules only"})`);
});
