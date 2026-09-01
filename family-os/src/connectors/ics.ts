import type { CalendarEvent } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { addDays, dateOf, toLocal, weekdayOf, type LocalDateTime } from "../core/time.ts";

/**
 * iCalendar subscriptions. Nearly every school platform, sports club system and
 * shared calendar can publish one, which makes this the widest connector we have
 * that needs no OAuth and no scraping.
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  location?: string;
  description?: string;
  start: LocalDateTime;
  end: LocalDateTime;
  allDay: boolean;
  rrule?: string;
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = unfold(text);
  const out: IcsEvent[] = [];
  let cur: Record<string, { params: Record<string, string>; value: string }> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT" && cur) {
      const ev = toEvent(cur);
      if (ev) out.push(ev);
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i === -1) continue;
      const [nameAndParams, value] = [line.slice(0, i), line.slice(i + 1)];
      const [name, ...params] = nameAndParams.split(";");
      const p: Record<string, string> = {};
      for (const param of params) {
        const [k, v] = param.split("=");
        if (k && v) p[k.toUpperCase()] = v;
      }
      cur[name.toUpperCase()] = { params: p, value };
    }
  }
  return out;
}

function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const l of raw) {
    if ((l.startsWith(" ") || l.startsWith("\t")) && lines.length) lines[lines.length - 1] += l.slice(1);
    else lines.push(l);
  }
  return lines;
}

function parseDt(v: string, params: Record<string, string>): { at: LocalDateTime; allDay: boolean } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v.trim());
  if (!m) return null;
  if (params.VALUE === "DATE" || !m[4]) return { at: `${m[1]}-${m[2]}-${m[3]}T00:00`, allDay: true };
  if (m[7] === "Z") {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)));
    return { at: toLocal(d), allDay: false };
  }
  // TZID or floating: treated as household local time.
  return { at: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`, allDay: false };
}

function toEvent(f: Record<string, { params: Record<string, string>; value: string }>): IcsEvent | null {
  const start = f.DTSTART ? parseDt(f.DTSTART.value, f.DTSTART.params) : null;
  if (!start) return null;
  const end = f.DTEND ? parseDt(f.DTEND.value, f.DTEND.params) : null;
  const unescape = (s?: string) => s?.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\;/g, ";").trim();
  return {
    uid: f.UID?.value ?? `${start.at}-${f.SUMMARY?.value ?? ""}`,
    summary: unescape(f.SUMMARY?.value) ?? "(untitled)",
    location: unescape(f.LOCATION?.value),
    description: unescape(f.DESCRIPTION?.value),
    start: start.at,
    end: end?.at ?? (start.allDay ? addDays(start.at, 1) : addMinutesLocal(start.at, 60)),
    allDay: start.allDay,
    rrule: f.RRULE?.value,
  };
}

function addMinutesLocal(s: LocalDateTime, min: number): LocalDateTime {
  const d = new Date(s);
  d.setMinutes(d.getMinutes() + min);
  return toLocal(d);
}

const BYDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Expand simple recurrence (DAILY / WEEKLY with INTERVAL, BYDAY, UNTIL, COUNT) inside a horizon. */
export function expandIcs(events: IcsEvent[], from: LocalDateTime, horizonDays = 60): IcsEvent[] {
  const out: IcsEvent[] = [];
  const fromDay = dateOf(from);
  const toDay = dateOf(addDays(from, horizonDays));
  for (const ev of events) {
    if (!ev.rrule) {
      if (dateOf(ev.start) >= fromDay && dateOf(ev.start) <= toDay) out.push(ev);
      continue;
    }
    const rule = Object.fromEntries(ev.rrule.split(";").map((kv) => kv.split("=") as [string, string]));
    const freq = rule.FREQ;
    const interval = Number(rule.INTERVAL ?? 1);
    const until = rule.UNTIL ? parseDt(rule.UNTIL, {})?.at : undefined;
    const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
    const days = rule.BYDAY ? rule.BYDAY.split(",").map((d) => BYDAY[d.slice(-2)]).filter((d) => d !== undefined) : [weekdayOf(ev.start)];
    const durationMin = Math.round((new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
    let produced = 0;
    for (let i = 0; i <= horizonDays + 366 && produced < count; i++) {
      const day = addDays(ev.start, i);
      if (until && dateOf(day) > dateOf(until)) break;
      if (dateOf(day) > toDay) break;
      const weeksSince = Math.floor(i / 7);
      const ok = freq === "DAILY" ? i % interval === 0 : freq === "WEEKLY" ? days.includes(weekdayOf(day)) && weeksSince % interval === 0 : i === 0;
      if (!ok) continue;
      produced += 1;
      if (dateOf(day) < fromDay) continue;
      const start = `${dateOf(day)}T${ev.start.slice(11)}`;
      out.push({ ...ev, uid: `${ev.uid}@${dateOf(day)}`, start, end: addMinutesLocal(start, durationMin), rrule: undefined });
    }
  }
  return out;
}

export async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(url.replace(/^webcal:\/\//i, "https://"), { headers: { accept: "text/calendar, */*" } });
  if (!res.ok) throw new Error(`Calendar feed returned ${res.status}`);
  return res.text();
}

/** Import a feed into the household calendar. Idempotent on uid. */
export function importIcsText(state: State, text: string, opts: { url: string; label: string; childId?: string }): { added: number; total: number } {
  const expanded = expandIcs(parseIcs(text), state.clock.now());
  const kids = state.household.people.filter((p) => p.role === "child");
  let added = 0;
  for (const ev of expanded) {
    const id = `ics:${opts.label}:${ev.uid}`;
    if (state.calendar.some((e) => e.id === id)) continue;
    const named = kids.filter((k) => new RegExp(`\\b${k.name}\\b`, "i").test(ev.summary)).map((k) => k.id);
    const personIds = named.length ? named : opts.childId ? [opts.childId] : [];
    const place = state.household.places.find((p) => ev.location && (ev.location.toLowerCase().includes(p.name.toLowerCase()) || (p.aliases ?? []).some((a) => ev.location!.toLowerCase().includes(a.toLowerCase()))));
    const cal: CalendarEvent = { id, title: ev.summary, personIds, start: ev.start, end: ev.end, placeId: place?.id, locationText: ev.location, source: "ics", sourceId: opts.label, notes: ev.description ? [ev.description.slice(0, 200)] : undefined };
    state.calendar.push(cal);
    added += 1;
  }
  const existing = state.connections.ics?.find((c) => c.url === opts.url);
  const record = { url: opts.url, label: opts.label, childId: opts.childId, lastSync: state.clock.now(), events: expanded.length };
  if (existing) Object.assign(existing, record);
  else (state.connections.ics ??= []).push(record);
  return { added, total: expanded.length };
}
