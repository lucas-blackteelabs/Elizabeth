import type { CalendarEvent, Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace, personName, placeName } from "../core/state.ts";
import { addMinutes, fmtTime, fmtWhen, minutesBetween, dateOf, withTime } from "../core/time.ts";
import { findConflicts, makeEvent } from "../core/calendar.ts";
import { evaluateEventPolicies, policy } from "../core/policy.ts";
import { action, empty, type AgentOutput } from "./shared.ts";

const AGENT = "scheduler";

export interface SchedulePlan extends AgentOutput {
  candidate?: CalendarEvent; // the event this signal creates or moves
  moveOf?: CalendarEvent; // existing event being moved
  needsTransport: boolean;
  earliestFeasible?: string; // for negotiations (co-parent handover)
}

/** Places the signal on the household calendar, or explains why it cannot go there cleanly. */
export function schedule(state: State, signal: Signal): SchedulePlan {
  const out: SchedulePlan = { ...empty(), needsTransport: false };
  const ex = signal.extracted;
  const h = state.household;
  if (!ex.when || signal.kind === "purchase_need" || signal.kind === "fyi") {
    if (signal.kind === "fyi" && ex.when) out.rationale.push(`Optional: ${ex.title} on ${fmtWhen(ex.when.start, ex.when.end)}. Not added to the calendar.`);
    return out;
  }

  const kids = ex.childIds;
  const recurring = signal.kind === "registration";
  const foodAdjacent = signal.kind === "invitation" || /lunch|food|pizza|cake|snack/i.test(signal.raw.body);
  out.flags.push(...evaluateEventPolicies(h, ex, { recurring, foodAdjacent }));

  // ── Co-parent handover negotiation ────────────────────────────────────────
  if (signal.kind === "coparent_message") {
    const custody = policy(h, "custody");
    const childId = String(custody?.params.childId ?? kids[0]);
    const requested = ex.when.start;
    const standard = custody ? withTime(requested, String(custody.params.handoverTime)) : undefined;
    const busy = state.calendar.filter((e) => e.personIds.includes(childId) && dateOf(e.start) === dateOf(requested) && e.end > addMinutes(requested, -60));
    let earliest = requested;
    for (const e of busy) {
      const travel = (h.places.find((p) => p.id === e.placeId)?.travelMinutesFromHome ?? 0) + (h.places.find((p) => p.id === ex.placeId)?.travelMinutesFromHome ?? 0) - 10;
      const feasible = addMinutes(e.end, Math.max(travel, 10));
      if (feasible > earliest) {
        earliest = feasible;
        out.rationale.push(`${personName(state, childId)} has ${e.title} until ${fmtTime(e.end)} at ${placeName(state, e.placeId) ?? "school"}; earliest realistic handover is ${fmtTime(feasible)}.`);
      }
    }
    if (standard) out.rationale.push(`Standing handover is ${fmtTime(standard)}. Request is ${fmtTime(requested)}.`);
    out.earliestFeasible = earliest;
    if (earliest === requested) out.rationale.push(`${fmtTime(requested)} works: nothing on ${personName(state, childId)}'s calendar.`);
    out.candidate = makeEvent(`Handover: ${personName(state, childId)} to ${signal.raw.from}`, [childId], earliest, addMinutes(earliest, 15), { placeId: ex.placeId, sourceId: signal.id, driverId: h.people.find((p) => p.role === "parent")?.id });
    out.needsTransport = true;
    trace(state, signal.id, AGENT, "negotiate", out.rationale.join(" "));
    return out;
  }

  // ── Moving an existing standing occurrence ────────────────────────────────
  if (signal.kind === "schedule_change" && ex.previousWhen) {
    const existing = state.calendar.find((e) => kids.some((k) => e.personIds.includes(k)) && dateOf(e.start) === dateOf(ex.previousWhen!.start) && e.start === ex.previousWhen!.start);
    if (existing) {
      const duration = minutesBetween(existing.start, existing.end);
      const start = ex.when.start;
      const end = addMinutes(start, duration);
      out.moveOf = existing;
      out.candidate = { ...existing, start, end, placeId: ex.placeId ?? existing.placeId, notes: [`Moved from ${fmtTime(existing.start)} (${signal.raw.from})`] };
      out.needsTransport = true;
      out.rationale.push(`Matched to ${existing.title} (${fmtWhen(existing.start, existing.end)}). New window ${fmtTime(start)}–${fmtTime(end)}.`);
      out.actions.push(action(AGENT, "calendar_write", `Move ${existing.title} to ${fmtTime(start)}`, `${fmtWhen(start, end)} at ${placeName(state, out.candidate.placeId)}. Both parents' calendars updated.`, { payload: { op: "move", eventId: existing.id, start, end } }));
      const conflicts = findConflicts(h, state.calendar, { start, end, personIds: kids, driverId: existing.driverId, placeId: out.candidate.placeId, ignoreEventId: existing.id });
      for (const c of conflicts) {
        out.rationale.push(`Conflict: ${c.detail}`);
        if (c.kind === "person") out.flags.push({ level: "warn", message: c.detail });
      }
      trace(state, signal.id, AGENT, "move", out.rationale.join(" "));
      return out;
    }
    out.rationale.push("Could not match the old time to anything on the calendar; adding as a new event.");
  }

  // ── A new event ───────────────────────────────────────────────────────────
  const end = ex.when.end ?? (ex.when.allDay ? addMinutes(ex.when.start, 24 * 60 - 1) : addMinutes(ex.when.start, 60));
  const schoolRun = signal.kind === "permission_request";
  out.candidate = makeEvent(ex.title.replace(/^[^:]+:\s*/, ""), kids, ex.when.start, end, { placeId: ex.placeId, locationText: ex.locationText, sourceId: signal.id, notes: ex.items.length ? [`Bring: ${ex.items.join(", ")}`] : undefined });
  out.needsTransport = !schoolRun && ex.requires.includes("transport") && !recurring;
  const conflicts = findConflicts(h, state.calendar, { start: ex.when.start, end, personIds: kids, placeId: ex.placeId });
  for (const c of conflicts.filter((c) => c.kind === "person")) {
    out.flags.push({ level: "warn", message: `Clash: ${c.detail}` });
    out.rationale.push(`Clash: ${c.detail}`);
  }
  if (!conflicts.length) out.rationale.push(`No clashes for ${kids.map((k) => personName(state, k)).join(" or ")} on ${fmtWhen(ex.when.start, end, ex.when.allDay)}.`);
  if (!recurring) {
    out.actions.push(action(AGENT, "calendar_write", `Add ${out.candidate.title}`, `${fmtWhen(ex.when.start, end, ex.when.allDay)}${ex.locationText ? ` · ${ex.locationText}` : ""}`, { payload: { op: "add", event: out.candidate } }));
  } else {
    out.rationale.push(`First session ${fmtWhen(ex.when.start, end)}; not on the calendar until enrolled.`);
  }
  trace(state, signal.id, AGENT, "place", out.rationale.join(" "));
  return out;
}
