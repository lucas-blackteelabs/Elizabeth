import { createState } from "./core/state.ts";
import { fixedClock } from "./core/time.ts";
import { seedHousehold } from "./demo/household.ts";
import { demoInbox, DEMO_NOW } from "./demo/inbox.ts";
import { ingest, trustSummary } from "./orchestrator.ts";
import { composeBrief } from "./agents/brief.ts";
import { TRUST_LABELS } from "./core/trust.ts";
import type { BriefItem } from "./core/types.ts";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const amber = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

const state = createState(seedHousehold(), fixedClock(DEMO_NOW));
const verbose = process.argv.includes("--trace");

console.log(bold(`\n${state.household.name} · Evening Brief · ${DEMO_NOW.replace("T", " ")}`));
console.log(dim(`${demoInbox.length} inputs arrived today across email, WhatsApp and SMS. Nobody typed anything in.\n`));

for (const raw of demoInbox) await ingest(state, raw);

const brief = composeBrief(state);
console.log(bold(brief.headline));
console.log(dim(`Decision compression: ${brief.compression.signals} signals → ${brief.compression.decisions} decisions · ${brief.compression.automated} actions executed · ${brief.compression.deferred} parked · ${brief.compression.fyi} FYI\n`));

const section = (title: string, items: BriefItem[], colour: (s: string) => string) => {
  if (!items.length) return;
  console.log(colour(bold(`── ${title} ──`)));
  for (const it of items) {
    console.log(`${bold(it.title)}${it.dueLabel ? dim(`  (${it.dueLabel})`) : ""}`);
    console.log(`   ${it.summary}`);
    for (const a of it.actions) {
      const mark = a.disposition === "executed" ? green("✓") : a.disposition === "staged" ? amber("▷") : a.disposition === "suggested" ? cyan("?") : dim("·");
      console.log(`   ${mark} ${a.title}${a.amount ? dim(` $${a.amount}`) : ""} ${dim(`[${a.disposition}]`)}`);
      if (a.cls === "outbound_message" || a.cls === "coparent_reply") console.log(dim(`      “${a.detail.replace(/\n/g, " ")}”`));
    }
    for (const alt of it.alternatives) console.log(dim(`   ↳ alt: ${alt.label}`));
    for (const f of it.flags) console.log(`   ${f.level === "block" ? red("⛔") : f.level === "warn" ? amber("⚠") : dim("ℹ")} ${f.message}`);
    if (verbose) for (const w of it.why) console.log(dim(`      why: ${w}`));
    console.log();
  }
};
section("Decide tonight", brief.decide, amber);
section("Done for you", brief.done, green);
section("Parked for later", brief.later, cyan);
section("FYI", brief.fyi, dim);

console.log(bold("── Trust ladder ──"));
for (const t of trustSummary(state)) console.log(`   ${t.label.padEnd(44)} ${TRUST_LABELS[t.level as 0]}${t.pinned ? dim(" (pinned)") : ""}`);

if (verbose) {
  console.log(bold("\n── Trace ──"));
  for (const t of state.trace) console.log(dim(`${t.signalId} ${t.agent.padEnd(11)} ${t.step.padEnd(12)} ${t.detail}`));
}
console.log();
