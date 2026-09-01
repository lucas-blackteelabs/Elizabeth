import type { Signal, Urgency } from "../core/types.ts";
import { relativeDays, type Clock, type LocalDateTime } from "../core/time.ts";

export interface Triage {
  urgency: Urgency;
  dueAt?: LocalDateTime;
  reasons: string[];
}

/** Decide how loudly a signal should reach a parent, and by when it must be resolved. */
export function triage(signal: Signal, clock: Clock): Triage {
  const now = clock.now();
  const ex = signal.extracted;
  const reasons: string[] = [];
  if (signal.kind === "fyi") return { urgency: "fyi", reasons: ["Nothing is asked of you."] };

  const dueAt = ex.deadline ?? (signal.kind === "schedule_change" || signal.kind === "coparent_message" || signal.kind === "appointment" ? ex.when?.start : undefined) ?? ex.when?.start;
  const daysToDue = dueAt ? relativeDays(now, dueAt) : undefined;
  const daysToEvent = ex.when ? relativeDays(now, ex.when.start) : undefined;

  if (ex.deadline) reasons.push(`Deadline in ${daysToDue} day${daysToDue === 1 ? "" : "s"}.`);
  if (ex.when) reasons.push(`Happens in ${daysToEvent} day${daysToEvent === 1 ? "" : "s"}.`);
  if (ex.tone?.hostile) reasons.push("Tone flagged; handled through the neutral channel.");

  let urgency: Urgency;
  if (daysToDue !== undefined && daysToDue <= 3) urgency = "now";
  else if (signal.kind === "schedule_change" && daysToEvent !== undefined && daysToEvent <= 7) urgency = "now";
  else if (daysToDue !== undefined && daysToDue <= 10) urgency = "this_week";
  else if (daysToEvent !== undefined && daysToEvent <= 10) urgency = "this_week";
  else urgency = "later";
  if (!ex.when && !ex.deadline) {
    urgency = signal.kind === "coparent_message" ? "now" : "this_week";
    reasons.push("Undated; surfacing so it is not lost.");
  }
  return { urgency, dueAt, reasons };
}
