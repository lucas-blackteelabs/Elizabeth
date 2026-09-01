import type { Disposition, LedgerEntry, LedgerState, Proposal, Signal } from "./types.ts";
import type { Clock } from "./time.ts";
import { newId } from "./time.ts";

const TRANSITIONS: Record<LedgerState, LedgerState[]> = {
  detected: ["awaiting_decision", "executed", "scheduled", "noted", "declined"],
  awaiting_decision: ["executed", "declined", "snoozed"],
  snoozed: ["awaiting_decision", "executed", "declined"],
  scheduled: ["awaiting_decision", "executed", "declined"],
  executed: ["declined"], // an executed item can still be reversed by a parent
  declined: [],
  noted: [],
};

export function openEntry(clock: Clock, signal: Signal, proposal: Proposal, dispositions: { actionId: string; disposition: Disposition }[]): LedgerEntry {
  const entry: LedgerEntry = {
    id: newId("led"),
    signalId: signal.id,
    proposalId: proposal.id,
    title: proposal.title,
    childIds: signal.extracted.childIds,
    kind: signal.kind,
    state: "detected",
    urgency: proposal.urgency,
    dueAt: proposal.dueAt,
    dispositions,
    history: [{ at: clock.now(), state: "detected", by: "agent", note: `Detected from ${signal.raw.channel} (${signal.raw.from}).` }],
  };
  const needsParent = dispositions.some((d) => d.disposition === "staged" || d.disposition === "suggested");
  const hasExecuted = dispositions.some((d) => d.disposition === "executed");
  if (proposal.flags.some((f) => f.level === "block")) {
    transition(clock, entry, "awaiting_decision", "agent", "Blocked by policy. Needs a parent.");
  } else if (needsParent) {
    transition(clock, entry, proposal.urgency === "later" ? "scheduled" : "awaiting_decision", "agent", needsParent && hasExecuted ? "Routine parts done. One decision left for you." : "Prepared. Waiting for your tap.");
  } else if (hasExecuted) {
    transition(clock, entry, "executed", "agent", "Handled end to end within your trust settings.");
  } else {
    transition(clock, entry, "noted", "agent", "Nothing to do. Filed for context.");
  }
  return entry;
}

export function transition(clock: Clock, entry: LedgerEntry, to: LedgerState, by: "agent" | "parent", note: string): void {
  const allowed = TRANSITIONS[entry.state];
  if (!allowed.includes(to)) throw new Error(`Cannot move ledger entry ${entry.id} from ${entry.state} to ${to}`);
  entry.state = to;
  entry.history.push({ at: clock.now(), state: to, by, note });
}

export function canTransition(entry: LedgerEntry, to: LedgerState): boolean {
  return TRANSITIONS[entry.state].includes(to);
}
