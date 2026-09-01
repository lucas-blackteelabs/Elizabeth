import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace, personName } from "../core/state.ts";
import { dateOf, fmtDay, fmtTime, weekdayOf } from "../core/time.ts";
import { evaluateLoadPolicies } from "../core/policy.ts";
import { findConflicts } from "../core/calendar.ts";
import { action, empty, type AgentOutput } from "./shared.ts";

const AGENT = "development";

/** Connects logistics to what the parents said they want for each child. */
export function development(state: State, signal: Signal): AgentOutput {
  const out = empty();
  const ex = signal.extracted;
  const h = state.household;
  if (signal.kind !== "registration" || !ex.when) return out;

  const seasonFrom = dateOf(ex.when.start);
  const seasonTo = ex.otherDates.map(dateOf).filter((d) => d > seasonFrom).sort().pop() ?? addMonths(seasonFrom, 3);
  const program = signal.raw.subject ?? "program";
  for (const cid of ex.childIds) {
    const kid = h.people.find((p) => p.id === cid)!;
    const interest = ex.interestTags.filter((t) => kid.interests?.some((i) => i.toLowerCase().includes(t)));
    const ageOk = !ex.ageRange || (kid.age !== undefined && kid.age >= ex.ageRange.min && kid.age <= ex.ageRange.max);
    const category = ex.interestTags.some((t) => ["art", "music", "dance", "drama"].includes(t)) ? "creative" : "sport";
    out.flags.push(...evaluateLoadPolicies(h, cid, { category, from: seasonFrom, to: seasonTo }));
    const values = h.values.filter((v) => (category === "sport" && /resilience|team|outdoor/.test(v)) || (category === "creative" && /creativ/.test(v)));
    const r: string[] = [];
    r.push(interest.length ? `${kid.name} lists ${interest.join(", ")} as an interest.` : `${kid.name} has not shown interest in this yet.`);
    r.push(ageOk ? `Age fits${ex.ageRange ? ` (${ex.ageRange.min}–${ex.ageRange.max})` : ""}.` : "Age is outside the program range.");
    if (values.length) r.push(`Supports what you said matters: ${values.join(", ")}.`);
    const conflicts = findConflicts(h, state.calendar, { start: ex.when.start, end: ex.when.end ?? ex.when.start, personIds: [cid], driverId: h.standing.find((s) => s.personId === cid)?.usualDriverId, placeId: ex.placeId });
    r.push(conflicts.length ? `Clashes on the first session: ${conflicts.map((c) => c.detail).join(" ")}` : `First session ${fmtDay(ex.when.start)} ${fmtTime(ex.when.start)} is clear, including the drive.`);
    out.rationale.push(...r);
    if (ageOk) {
      out.actions.push(action(AGENT, "enrolment", `Enrol ${kid.name} in ${program.replace(/registrations? now open/i, "").trim() || "the program"}${ex.amount ? ` ($${ex.amount})` : ""}`, r.join(" "), {
        amount: ex.amount,
        payee: ex.payee,
        payload: { childId: cid, title: ex.interestTags[0] ? `${capitalise(ex.interestTags[0])}` : program, category, day: weekdayOf(ex.when.start), start: ex.when.start.slice(11), end: (ex.when.end ?? ex.when.start).slice(11), placeId: ex.placeId, season: { from: seasonFrom, to: seasonTo }, cost: ex.amount },
      }));
    }
  }
  out.alternatives.push({ label: "Skip this season", detail: "Keep Saturday mornings open; revisit in autumn.", actions: [] });
  trace(state, signal.id, AGENT, "fit", out.rationale.join(" "));
  return out;
}

function addMonths(day: string, n: number): string {
  const d = new Date(day);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
