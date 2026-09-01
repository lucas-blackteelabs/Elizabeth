import type { CalendarEvent, Household, LedgerEntry, Proposal, Reminder, Signal, TraceStep, TrustSetting } from "./types.ts";
import type { Clock } from "./time.ts";
import { expandStanding } from "./calendar.ts";
import { defaultTrust } from "./trust.ts";

export interface Draft {
  id: string;
  to: string;
  channel: string;
  text: string;
  status: "draft" | "sent";
  signalId: string;
}

export interface Spend {
  month: string; // YYYY-MM
  amount: number;
  label: string;
  signalId: string;
}

export interface State {
  household: Household;
  clock: Clock;
  trust: TrustSetting[];
  calendar: CalendarEvent[];
  reminders: Reminder[];
  signals: Signal[];
  proposals: Proposal[];
  ledger: LedgerEntry[];
  trace: TraceStep[];
  drafts: Draft[];
  spend: Spend[];
  promotionsOffered: string[];
}

export function createState(household: Household, clock: Clock): State {
  return {
    household,
    clock,
    trust: defaultTrust(household),
    calendar: expandStanding(household, clock.now()),
    reminders: [],
    signals: [],
    proposals: [],
    ledger: [],
    trace: [],
    drafts: [],
    spend: [],
    promotionsOffered: [],
  };
}

export function trace(state: State, signalId: string, agent: string, step: string, detail: string): void {
  state.trace.push({ at: state.clock.now(), signalId, agent, step, detail });
}

export function monthSpend(state: State, month: string): number {
  return state.spend.filter((s) => s.month === month).reduce((a, s) => a + s.amount, 0);
}

export function personName(state: State, id: string | undefined): string {
  return state.household.people.find((p) => p.id === id)?.name ?? "someone";
}

export function placeName(state: State, id: string | undefined): string | undefined {
  return state.household.places.find((p) => p.id === id)?.name;
}
