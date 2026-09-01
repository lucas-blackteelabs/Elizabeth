import type { CalendarEvent, Household, Person, StandingCommitment } from "./types.ts";
import { addDays, addMinutes, dateOf, fromLocal, overlaps, toLocal, weekdayOf, withTime, type LocalDateTime } from "./time.ts";
import { newId } from "./time.ts";

const HORIZON_DAYS = 42;

/** Expand recurring commitments into concrete events for the planning horizon. */
export function expandStanding(h: Household, from: LocalDateTime): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const start = dateOf(from) + "T00:00";
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const day = addDays(start, i);
    const dow = weekdayOf(day);
    for (const s of h.standing) {
      if (s.day !== dow) continue;
      if (s.season && (dateOf(day) < s.season.from || dateOf(day) > s.season.to)) continue;
      out.push({
        id: `${s.id}@${dateOf(day)}`,
        title: s.title,
        personIds: [s.personId],
        start: withTime(day, s.start),
        end: withTime(day, s.end),
        placeId: s.placeId,
        driverId: s.usualDriverId,
        source: "standing",
        sourceId: s.id,
      });
    }
  }
  return out;
}

export interface Conflict {
  event: CalendarEvent;
  kind: "person" | "driver";
  personId: string;
  detail: string;
}

/** Find who is double-booked if `candidate` is placed on the calendar. */
export function findConflicts(h: Household, calendar: CalendarEvent[], candidate: { start: LocalDateTime; end: LocalDateTime; personIds: string[]; driverId?: string; placeId?: string; ignoreEventId?: string }): Conflict[] {
  const conflicts: Conflict[] = [];
  const travel = (a?: string, b?: string) => {
    const pa = h.places.find((p) => p.id === a);
    const pb = h.places.find((p) => p.id === b);
    if (!a || !b || a === b) return 0;
    if (pa && pb && pa.suburb === pb.suburb) return 5; // same suburb: a short hop
    return Math.max(pa?.travelMinutesFromHome ?? 0, pb?.travelMinutesFromHome ?? 0);
  };
  for (const ev of calendar) {
    if (ev.id === candidate.ignoreEventId) continue;
    for (const pid of candidate.personIds) {
      if (ev.personIds.includes(pid) && overlaps(candidate.start, candidate.end, ev.start, ev.end)) {
        const person = h.people.find((p) => p.id === pid);
        conflicts.push({ event: ev, kind: "person", personId: pid, detail: `${person?.name} already has ${ev.title} ${ev.start.slice(11)}–${ev.end.slice(11)}.` });
      }
    }
    if (candidate.driverId && ev.driverId === candidate.driverId) {
      const buffer = travel(candidate.placeId, ev.placeId);
      if (overlaps(addMinutes(candidate.start, -buffer), addMinutes(candidate.end, buffer), ev.start, ev.end)) {
        const person = h.people.find((p) => p.id === candidate.driverId);
        conflicts.push({ event: ev, kind: "driver", personId: candidate.driverId, detail: `${person?.name} is driving to ${ev.title} ${ev.start.slice(11)}–${ev.end.slice(11)}${buffer ? ` (${buffer} min apart)` : ""}.` });
      }
    }
  }
  return conflicts;
}

/** Is this adult free for the window, considering work blocks and calendar duties? */
export function adultFree(h: Household, calendar: CalendarEvent[], adult: Person, start: LocalDateTime, end: LocalDateTime, placeId?: string, ignoreEventId?: string): { free: boolean; reason?: string; flexible?: boolean } {
  const dow = weekdayOf(start);
  for (const block of adult.unavailable ?? []) {
    if (block.day !== dow) continue;
    const bs = withTime(start, block.start);
    const be = withTime(start, block.end);
    if (overlaps(start, end, bs, be)) return { free: false, reason: `${adult.name} has ${block.label} ${block.start}–${block.end}`, flexible: block.flexible };
  }
  const c = findConflicts(h, calendar, { start, end, personIds: [], driverId: adult.id, placeId, ignoreEventId });
  if (c.length) return { free: false, reason: c[0].detail };
  return { free: true };
}

export interface DriverPlan {
  driverId?: string;
  rationale: string[];
  alternatives: { driverId: string; reason: string }[];
}

/** Assign a driver for a child's event: usual driver first, then any free adult in the household. */
export function planDriver(h: Household, calendar: CalendarEvent[], ev: { start: LocalDateTime; end: LocalDateTime; placeId?: string; childIds: string[]; preferredDriverId?: string; ignoreEventId?: string }): DriverPlan {
  const travelMin = h.places.find((p) => p.id === ev.placeId)?.travelMinutesFromHome ?? 15;
  const depart = addMinutes(ev.start, -travelMin);
  const back = addMinutes(ev.end, travelMin);
  const rationale: string[] = [];
  const adults = h.people.filter((p) => p.role === "parent" && p.canDrive);
  const ordered = ev.preferredDriverId ? [...adults].sort((a, b) => (a.id === ev.preferredDriverId ? -1 : b.id === ev.preferredDriverId ? 1 : 0)) : adults;
  const alternatives: { driverId: string; reason: string }[] = [];
  let chosen: string | undefined;
  for (const a of ordered) {
    const f = adultFree(h, calendar, a, depart, back, ev.placeId, ev.ignoreEventId);
    if (f.free && !chosen) {
      chosen = a.id;
      rationale.push(`${a.name} is free ${depart.slice(11)}–${back.slice(11)} (door to door, ${travelMin} min each way).`);
    } else if (f.free) {
      alternatives.push({ driverId: a.id, reason: `${a.name} is also free.` });
    } else {
      rationale.push(`${f.reason?.replace(/\.$/, "")}${f.flexible ? " (flexible)" : ""}.`);
      if (f.flexible) alternatives.push({ driverId: a.id, reason: `${a.name} could move ${f.reason?.split(" has ")[1] ?? "their block"}.` });
    }
  }
  if (!chosen) rationale.push("No parent is free without moving something.");
  return { driverId: chosen, rationale, alternatives };
}

export function makeEvent(title: string, personIds: string[], start: LocalDateTime, end: LocalDateTime, extra: Partial<CalendarEvent> = {}): CalendarEvent {
  return { id: newId("ev"), title, personIds, start, end, source: "signal", ...extra };
}

export function nextOccurrence(calendar: CalendarEvent[], standingId: string, after: LocalDateTime): CalendarEvent | undefined {
  return calendar
    .filter((e) => e.sourceId === standingId && fromLocal(e.start) >= fromLocal(after))
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

export function sameDayEvents(calendar: CalendarEvent[], day: LocalDateTime): CalendarEvent[] {
  return calendar.filter((e) => dateOf(e.start) === dateOf(day)).sort((a, b) => a.start.localeCompare(b.start));
}

export function nowLocal(): LocalDateTime {
  return toLocal(new Date());
}

export function standingById(h: Household, id: string): StandingCommitment | undefined {
  return h.standing.find((s) => s.id === id);
}
