// All times in the prototype are "household local" naive datetimes: "YYYY-MM-DDTHH:mm".
// The process timezone is pinned so Date arithmetic is deterministic wherever the demo runs.
process.env.TZ = process.env.FAMILY_OS_TZ ?? "Australia/Sydney";

export type LocalDateTime = string; // "2026-09-10T08:15"

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocal(d: Date): LocalDateTime {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocal(s: LocalDateTime): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(s);
  if (!m) throw new Error(`Bad local datetime: ${s}`);
  return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
}

export function addMinutes(s: LocalDateTime, minutes: number): LocalDateTime {
  const d = fromLocal(s);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocal(d);
}

export function addDays(s: LocalDateTime, days: number): LocalDateTime {
  const d = fromLocal(s);
  d.setDate(d.getDate() + days);
  return toLocal(d);
}

export function dateOf(s: LocalDateTime): string {
  return s.slice(0, 10);
}

export function timeOf(s: LocalDateTime): string {
  return s.slice(11, 16);
}

export function weekdayOf(s: LocalDateTime): number {
  return fromLocal(s).getDay();
}

export function minutesBetween(a: LocalDateTime, b: LocalDateTime): number {
  return Math.round((fromLocal(b).getTime() - fromLocal(a).getTime()) / 60000);
}

export function overlaps(aStart: LocalDateTime, aEnd: LocalDateTime, bStart: LocalDateTime, bEnd: LocalDateTime): boolean {
  return fromLocal(aStart) < fromLocal(bEnd) && fromLocal(bStart) < fromLocal(aEnd);
}

export function withTime(day: LocalDateTime, hhmm: string): LocalDateTime {
  return `${dateOf(day)}T${hhmm}`;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(s: LocalDateTime): string {
  const d = fromLocal(s);
  return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtTime(s: LocalDateTime): string {
  const d = fromLocal(s);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hh}${suffix}` : `${hh}:${pad(m)}${suffix}`;
}

export function fmtWhen(start: LocalDateTime, end?: LocalDateTime, allDay?: boolean): string {
  if (allDay) return fmtDay(start);
  return end ? `${fmtDay(start)} ${fmtTime(start)}–${fmtTime(end)}` : `${fmtDay(start)} ${fmtTime(start)}`;
}

export function relativeDays(from: LocalDateTime, to: LocalDateTime): number {
  const a = fromLocal(dateOf(from));
  const b = fromLocal(dateOf(to));
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function isWeekend(s: LocalDateTime): boolean {
  const d = weekdayOf(s);
  return d === 0 || d === 6;
}

/** A clock that can be frozen for deterministic demos and tests. */
export interface Clock {
  now(): LocalDateTime;
}

export function fixedClock(at: LocalDateTime): Clock {
  return { now: () => at };
}

export function systemClock(): Clock {
  return { now: () => toLocal(new Date()) };
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36).padStart(4, "0")}`;
}

export function resetIds(): void {
  counter = 0;
}
