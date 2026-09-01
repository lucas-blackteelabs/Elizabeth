import type { Action, Alternative, LedgerEntry, Proposal, RawMessage, Signal, CalendarEvent, Disposition } from "./core/types.ts";
import { newId } from "./core/time.ts";
import { type State, trace, personName } from "./core/state.ts";
import { parseSignal } from "./agents/intake.ts";
import { llmExtract } from "./llm/adapter.ts";
import { triage } from "./agents/triage.ts";
import { schedule } from "./agents/scheduler.ts";
import { logistics } from "./agents/logistics.ts";
import { procurement } from "./agents/procurement.ts";
import { development } from "./agents/development.ts";
import { comms } from "./agents/comms.ts";
import { guardian } from "./agents/guardian.ts";
import { merge, type AgentOutput } from "./agents/shared.ts";
import { dispose, recordApproval, recordOverride, CLASS_LABELS } from "./core/trust.ts";
import { openEntry, transition } from "./core/ledger.ts";
import { fmtTime, fmtWhen } from "./core/time.ts";

export interface IngestResult {
  signal: Signal;
  proposal: Proposal;
  entry: LedgerEntry;
  executed: Action[];
}

/**
 * The whole loop for one input:
 *   intake → triage → specialists (in parallel, conceptually) → guardian → trust → execute → ledger.
 */
export async function ingest(state: State, raw: RawMessage, opts: { useLlm?: boolean } = {}): Promise<IngestResult> {
  const signal = parseSignal({ ...raw, receivedAt: raw.receivedAt ?? state.clock.now() }, state.household, state.clock);
  if (opts.useLlm) await refineWithLlm(state, signal);
  state.signals.push(signal);
  trace(state, signal.id, "intake", "classify", `${signal.kind} (${Math.round(signal.confidence * 100)}%) · ${signal.extracted.childIds.map((c) => personName(state, c)).join(", ") || "no child"} · ${signal.extracted.when ? fmtWhen(signal.extracted.when.start, signal.extracted.when.end, signal.extracted.when.allDay) : "undated"}${signal.extracted.deadline ? ` · due ${signal.extracted.deadline.slice(0, 10)}` : ""}`);

  const t = triage(signal, state.clock);
  trace(state, signal.id, "triage", t.urgency, t.reasons.join(" "));

  const plan = schedule(state, signal);
  const combined = guardian(state, signal, merge(plan, logistics(state, signal, plan), procurement(state, signal), development(state, signal), comms(state, signal, plan)));

  const proposal: Proposal = {
    id: newId("prop"),
    signalId: signal.id,
    agent: "orchestrator",
    title: signal.extracted.title,
    summary: summarise(state, signal, combined),
    actions: combined.actions,
    alternatives: combined.alternatives,
    urgency: t.urgency,
    dueAt: t.dueAt,
    flags: combined.flags,
    rationale: [...t.reasons, ...combined.rationale],
  };
  state.proposals.push(proposal);

  const blocked = proposal.flags.some((f) => f.level === "block");
  const executed: Action[] = [];
  const dispositions: { actionId: string; disposition: Disposition }[] = [];
  for (const a of proposal.actions) {
    const verifiedPayee = state.household.places.some((p) => p.verifiedPayee && p.name === a.payee);
    const d = blocked ? { disposition: "staged" as Disposition, reason: "blocked by policy" } : dispose(state.trust, a, { verifiedPayee });
    if (d.disposition === "executed") {
      execute(state, a, signal.id);
      executed.push(a);
    }
    dispositions.push({ actionId: a.id, disposition: d.disposition });
    trace(state, signal.id, "trust", d.disposition, `${a.title}: ${d.reason}.`);
  }

  const entry = openEntry(state.clock, signal, proposal, dispositions);
  state.ledger.push(entry);
  trace(state, signal.id, "ledger", entry.state, entry.history[entry.history.length - 1].note);
  return { signal, proposal, entry, executed };
}

async function refineWithLlm(state: State, signal: Signal): Promise<void> {
  const r = await llmExtract(signal.raw, state.household, state.clock.now());
  if (!r) return;
  const ex = signal.extracted;
  if (r.kind) signal.kind = r.kind;
  if (r.title) ex.title = r.title;
  if (r.childNames?.length) {
    const ids = state.household.people.filter((p) => p.role === "child" && r.childNames!.some((n) => n.toLowerCase() === p.name.toLowerCase())).map((p) => p.id);
    if (ids.length) ex.childIds = ids;
  }
  if (r.when?.start) ex.when = { start: r.when.start.slice(0, 16), end: r.when.end?.slice(0, 16), allDay: r.when.allDay };
  if (r.previousWhen?.start) ex.previousWhen = { start: r.previousWhen.start.slice(0, 16), end: r.previousWhen.end?.slice(0, 16) };
  if (r.deadline) ex.deadline = r.deadline.slice(0, 10) + "T00:00";
  if (r.amount !== undefined) ex.amount = r.amount;
  if (r.items?.length) ex.items = r.items;
  if (r.requires?.length) ex.requires = r.requires;
  if (r.summary) ex.notes.push(r.summary);
  signal.parser = "llm";
  signal.confidence = Math.max(signal.confidence, 0.9);
}

/** Apply an action to household state. Everything here is reversible from the ledger. */
export function execute(state: State, a: Action, signalId: string): void {
  const p = a.payload ?? {};
  switch (a.cls) {
    case "calendar_write": {
      if (p.op === "add" && p.event) {
        const ev = p.event as CalendarEvent;
        if (!state.calendar.some((e) => e.id === ev.id)) state.calendar.push(ev);
      } else if (p.op === "move") {
        const ev = state.calendar.find((e) => e.id === p.eventId);
        if (ev) {
          ev.notes = [...(ev.notes ?? []), `Moved from ${fmtTime(ev.start)}`];
          ev.start = String(p.start);
          ev.end = String(p.end);
        }
      } else if (p.op === "assign_driver") {
        const ev = state.calendar.find((e) => e.id === p.eventId);
        if (ev) ev.driverId = String(p.driverId);
      }
      break;
    }
    case "reminder":
      state.reminders.push({ id: newId("rem"), at: String(p.at), text: String(p.text), personIds: (p.personIds as string[]) ?? [], sourceId: signalId });
      break;
    case "payment":
    case "purchase":
      state.spend.push({ month: state.clock.now().slice(0, 7), amount: a.amount ?? 0, label: a.title, signalId });
      break;
    case "enrolment": {
      const c = p as { childId: string; title: string; category: "sport" | "creative"; day: number; start: string; end: string; placeId?: string; season: { from: string; to: string }; cost?: number };
      state.household.standing.push({ id: newId("s"), personId: c.childId, title: c.title, category: c.category, day: c.day, start: c.start, end: c.end, placeId: c.placeId ?? "pl_home", season: c.season, costPerTerm: c.cost, usualDriverId: state.household.people.find((x) => x.role === "parent")?.id });
      if (a.amount) state.spend.push({ month: c.season.from.slice(0, 7), amount: a.amount, label: a.title, signalId });
      break;
    }
    case "outbound_message":
    case "coparent_reply":
      state.drafts.push({ id: newId("msg"), to: String(p.to ?? ""), channel: String(p.channel ?? "sms"), text: String(p.text ?? a.detail), status: "sent", signalId });
      break;
    case "sign_form":
      break;
  }
}

export type DecisionKind = "approve" | "decline" | "snooze";

/** A parent's tap. Approving executes what was staged (or a chosen alternative) and teaches the trust ladder. */
export function decide(state: State, ledgerId: string, kind: DecisionKind, alternativeIndex?: number): LedgerEntry {
  const entry = state.ledger.find((e) => e.id === ledgerId);
  if (!entry) throw new Error(`No ledger entry ${ledgerId}`);
  const proposal = state.proposals.find((p) => p.id === entry.proposalId)!;
  const pending = proposal.actions.filter((a) => entry.dispositions.find((d) => d.actionId === a.id)?.disposition !== "executed");

  if (kind === "snooze") {
    transition(state.clock, entry, "snoozed", "parent", "Snoozed until tomorrow's brief.");
    return entry;
  }
  if (kind === "decline") {
    for (const a of pending) recordOverride(state.trust, a.cls);
    transition(state.clock, entry, "declined", "parent", "Declined. Trust for these action types stepped down.");
    return entry;
  }
  const alt: Alternative | undefined = alternativeIndex !== undefined ? proposal.alternatives[alternativeIndex] : undefined;
  const toRun = alt ? alt.actions : pending;
  for (const a of toRun) {
    execute(state, a, entry.signalId);
    const d = entry.dispositions.find((d) => d.actionId === a.id);
    if (d) d.disposition = "executed";
    else entry.dispositions.push({ actionId: a.id, disposition: "executed" });
    const { promotionOffered } = recordApproval(state.trust, a.cls);
    if (promotionOffered && !state.promotionsOffered.includes(a.cls)) state.promotionsOffered.push(a.cls);
  }
  if (alt && !proposal.actions.some((a) => alt.actions.includes(a))) proposal.actions.push(...alt.actions);
  if (alt) {
    // The unchosen staged actions are superseded, not executed.
    for (const a of pending) {
      const d = entry.dispositions.find((d) => d.actionId === a.id);
      if (d && d.disposition !== "executed") d.disposition = "observed";
    }
  }
  transition(state.clock, entry, "executed", "parent", alt ? `Approved alternative: ${alt.label}.` : "Approved. Done.");
  return entry;
}

function summarise(state: State, signal: Signal, out: AgentOutput): string {
  if (out.summary) return out.summary;
  const ex = signal.extracted;
  const bits: string[] = [];
  if (ex.when) bits.push(fmtWhen(ex.when.start, ex.when.end, ex.when.allDay));
  if (ex.locationText) bits.push(ex.locationText);
  if (ex.amount && signal.kind !== "purchase_need") bits.push(`$${ex.amount}`);
  if (signal.kind === "fyi") return signal.raw.body.replace(/\s+/g, " ").slice(0, 180) + (signal.raw.body.length > 180 ? "…" : "");
  const head = bits.join(" · ");
  return head || out.actions[0]?.title || signal.raw.subject || "";
}

export function trustSummary(state: State): { cls: string; label: string; level: number; approvals: number; overrides: number; pinned: boolean; promotionOffered: boolean }[] {
  return state.trust.map((t) => ({ cls: t.cls, label: CLASS_LABELS[t.cls], level: t.level, approvals: t.approvals, overrides: t.overrides, pinned: t.pinned, promotionOffered: state.promotionsOffered.includes(t.cls) }));
}
