import type { Brief, BriefItem, LedgerEntry, Proposal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { fmtDay, relativeDays } from "../core/time.ts";

/** One notification a day. Everything else is a tap away. */
export function composeBrief(state: State): Brief {
  const now = state.clock.now();
  const items = state.ledger.map((e) => toItem(state, e));
  const decide = items.filter((i) => i.entry.state === "awaiting_decision").sort(byDue);
  const done = items.filter((i) => i.entry.state === "executed");
  const later = items.filter((i) => i.entry.state === "scheduled" || i.entry.state === "snoozed").sort(byDue);
  const fyi = items.filter((i) => i.entry.state === "noted" || i.entry.state === "declined");
  const automated = state.ledger.reduce((n, e) => n + e.dispositions.filter((d) => d.disposition === "executed").length, 0);
  const headline = decide.length === 0
    ? `Nothing needs you tonight. ${automated} things handled quietly.`
    : `${decide.length} decision${decide.length === 1 ? "" : "s"} tonight, ${automated} things already handled${later.length ? `, ${later.length} parked for later` : ""}.`;
  return {
    generatedAt: now,
    headline,
    compression: { signals: state.signals.length, decisions: decide.length, automated, deferred: later.length, fyi: fyi.length },
    decide: decide.map(strip),
    done: done.map(strip),
    later: later.map(strip),
    fyi: fyi.map(strip),
  };
}

type Item = BriefItem & { entry: LedgerEntry };

function toItem(state: State, e: LedgerEntry): Item {
  const p = state.proposals.find((p) => p.id === e.proposalId)!;
  const now = state.clock.now();
  const due = e.dueAt ? relativeDays(now, e.dueAt) : undefined;
  return {
    entry: e,
    ledgerId: e.id,
    signalId: e.signalId,
    title: e.title,
    summary: p.summary,
    children: e.childIds.map((id) => state.household.people.find((x) => x.id === id)?.name ?? id),
    dueLabel: e.dueAt ? (due === 0 ? "today" : due === 1 ? "tomorrow" : due !== undefined && due < 0 ? "overdue" : `by ${fmtDay(e.dueAt)}`) : undefined,
    actions: p.actions.map((a) => ({ id: a.id, cls: a.cls, title: a.title, detail: a.detail, amount: a.amount, disposition: e.dispositions.find((d) => d.actionId === a.id)?.disposition ?? "suggested" })),
    alternatives: p.alternatives,
    flags: p.flags,
    why: p.rationale,
  };
}

function strip(i: Item): BriefItem {
  const { entry: _entry, ...rest } = i;
  return rest;
}

function byDue(a: Item, b: Item): number {
  return (a.entry.dueAt ?? "9999").localeCompare(b.entry.dueAt ?? "9999");
}

export function proposalSummary(p: Proposal): string {
  return p.summary;
}
