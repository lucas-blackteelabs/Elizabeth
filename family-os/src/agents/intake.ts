import type { Extracted, Household, Person, RawMessage, Requirement, Signal, SignalKind, TimeWindow } from "../core/types.ts";
import { addDays, addMinutes, dateOf, fromLocal, newId, toLocal, weekdayOf, type Clock, type LocalDateTime } from "../core/time.ts";

/**
 * Intake: the "implicit-first" data engine. Any text from any channel becomes a
 * typed Signal. The rules parser below is deliberately boring and inspectable;
 * an LLM (see ../llm/adapter.ts) can replace or refine it, but the household
 * must never depend on a model being available to keep the calendar right.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const WEEKDAY_RE = "(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)";
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const KIND_KEYWORDS: Record<Exclude<SignalKind, "fyi" | "event">, [RegExp, number][]> = {
  permission_request: [[/permission/i, 3], [/excursion/i, 3], [/consent/i, 3], [/field trip/i, 3]],
  schedule_change: [[/\bmoved\b/i, 3], [/rescheduled/i, 3], [/changed to/i, 2], [/\bnow at\b/i, 2], [/cancelled/i, 3], [/postponed/i, 3], [/instead of/i, 1], [/late notice/i, 1]],
  invitation: [[/invited?/i, 3], [/birthday/i, 2], [/\bparty\b/i, 3], [/rsvp/i, 2], [/turning \d+/i, 2]],
  appointment: [[/appointment/i, 4], [/\bdr\.?\s/i, 2], [/dent(ist|al)/i, 3], [/paediatric/i, 2], [/clinic/i, 1], [/check-?up/i, 3], [/reply\s+(yes|y)\b/i, 2]],
  purchase_need: [[/uniform/i, 3], [/\border(s|ing)?\b/i, 2], [/sizes?\b/i, 2], [/\bshop\b/i, 1], [/outgrow/i, 3]],
  registration: [[/registrations?/i, 3], [/\bregister\b/i, 3], [/enrol/i, 3], [/sign[- ]?up/i, 3], [/season/i, 1], [/trials?/i, 2]],
  coparent_message: [[/\bat mine\b/i, 2], [/your weekend/i, 2], [/my weekend/i, 2], [/handover/i, 2], [/custody/i, 3]],
};

const EVENT_RE = /\b(grand final|final|game|match|carnival|concert|performance|rehearsal|assembly|photo day|presentation|graduation|open day|sports day|disco|gala)\b/i;
const HOSTILE = [/\bagain\b/i, /\btypical\b/i, /\balways\b/i, /\bnever\b/i, /ridiculous/i, /unbelievable/i, /as usual/i, /!{1,}/, /\bcan'?t believe\b/i, /\byour fault\b/i, /\buseless\b/i];
const INTERESTS: [RegExp, string][] = [
  [/\b(football|footy|soccer)\b/i, "football"], [/cricket/i, "cricket"], [/swim/i, "swimming"], [/piano|music/i, "music"], [/netball/i, "netball"],
  [/\bart\b|drawing|painting/i, "art"], [/danc/i, "dance"], [/coding|robotics/i, "coding"], [/chess/i, "chess"], [/tennis/i, "tennis"], [/gymnastics/i, "gymnastics"], [/surf/i, "surf"], [/drama|theatre/i, "drama"],
];

interface DateMention { index: number; length: number; day: LocalDateTime; raw: string; explicit: boolean }
interface TimeMention { index: number; length: number; start: string; end?: string; raw: string }

export function parseSignal(raw: RawMessage, h: Household, clock: Clock): Signal {
  const now = raw.receivedAt ?? clock.now();
  const text = [raw.subject ?? "", raw.body].join("\n");
  const from = raw.from;

  const kind = classify(text, from, h);
  const children = detectChildren(text, from, h, kind);
  const dates = extractDates(text, now);
  const { times, moved } = extractTimes(text);
  const deadline = findDeadline(text, dates);
  const eventDates = dates.filter((d) => d !== deadline);
  const { when, previousWhen } = buildWindow(text, eventDates, times, moved, kind);
  const loc = detectLocation(text, h);
  const amounts = [...text.matchAll(/\$\s?(\d+(?:\.\d{2})?)/g)].map((m) => Number(m[1]));
  const items = extractItems(text);
  const contact = extractContact(text, from);
  const interestTags = INTERESTS.filter(([re]) => re.test(text)).map(([, tag]) => tag);
  const ageRange = extractAgeRange(text);
  const coparent = h.people.find((p) => p.role === "coparent");
  const tone = kind === "coparent_message" ? analyseTone(text, coparent?.name, children[0]?.name) : undefined;
  const title = makeTitle(kind, raw, children, h, loc.text, interestTags);

  const extracted: Extracted = {
    title,
    childIds: children.map((c) => c.id),
    when,
    previousWhen,
    deadline: deadline?.day,
    locationText: loc.text,
    placeId: loc.placeId,
    travelMinutes: loc.travelMinutes,
    amount: amounts[0],
    payee: payeeFor(kind, from, h, loc.placeId),
    requires: requirementsFor(kind, { amount: amounts[0], items, when, hasReply: /reply\s+[a-z]\b|reply to confirm|confirm/i.test(text) }),
    items,
    contact,
    interestTags,
    ageRange,
    tone,
    otherDates: eventDates.filter((d) => d.explicit && d.day !== when?.start.slice(0, 10) + "T00:00").map((d) => d.day),
    notes: [],
  };
  if (amounts.length > 1) extracted.notes.push(`Prices mentioned: ${amounts.map((a) => `$${a}`).join(", ")}.`);
  if (children.length === 0) extracted.notes.push("Could not tell which child this is about.");
  if (!when && kind !== "purchase_need" && kind !== "fyi") extracted.notes.push("No date found; treating as undated.");

  const confidence = scoreConfidence(kind, children.length, when, deadline);
  return { id: newId("sig"), receivedAt: now, raw, kind, confidence, extracted, parser: "rules" };
}

// ───────────────────────────── classification ─────────────────────────────

export function classify(text: string, from: string, h: Household): SignalKind {
  const coparent = h.people.find((p) => p.role === "coparent");
  if (coparent && (from.toLowerCase().includes(coparent.name.toLowerCase()) || (coparent.phone && from.replace(/\s/g, "").includes(coparent.phone.replace(/\s/g, ""))))) {
    return "coparent_message";
  }
  let best: SignalKind = "fyi";
  let bestScore = 0;
  for (const [kind, rules] of Object.entries(KIND_KEYWORDS) as [Exclude<SignalKind, "fyi" | "event">, [RegExp, number][]][]) {
    const score = rules.reduce((acc, [re, w]) => acc + (re.test(text) ? w : 0), 0);
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }
  if (bestScore >= 3) return best;
  return EVENT_RE.test(text) && extractTimes(text).times.length > 0 ? "event" : "fyi";
}

function detectChildren(text: string, from: string, h: Household, kind: SignalKind): Person[] {
  const kids = h.people.filter((p) => p.role === "child");
  const byName = kids.filter((k) => [k.name, ...(k.aliases ?? [])].some((n) => new RegExp(`\\b${n}(?:'s)?\\b`, "i").test(text)));
  if (byName.length) return byName;
  const year = /\byear\s*(\d{1,2})\b|\bY(\d{1,2})\b/i.exec(text);
  if (year) {
    const n = year[1] ?? year[2];
    const byYear = kids.filter((k) => k.yearLevel?.toLowerCase() === `year ${n}`);
    if (byYear.length) return byYear;
  }
  const range = extractAgeRange(text);
  if (range) {
    const byRange = kids.filter((k) => k.age !== undefined && k.age >= range.min && k.age <= range.max);
    if (byRange.length) return byRange;
  }
  const under = /\b(?:u|under[- ]?)(\d{1,2})s?\b/i.exec(text);
  if (under) {
    const n = Number(under[1]);
    const byAge = kids.filter((k) => k.age !== undefined && k.age <= n && k.age >= n - 2);
    if (byAge.length) return byAge;
  }
  const preschool = /preschool|kindy|daycare/i.test(text + from);
  if (preschool) {
    const pk = kids.filter((k) => /preschool/i.test(k.yearLevel ?? ""));
    if (pk.length) return pk;
  }
  const fromLower = from.toLowerCase();
  const bySchool = kids.filter((k) => k.school && fromLower.includes(k.school.toLowerCase().split(" ")[0]) || (k.school && new RegExp(k.school.split(" ").map((w) => w[0]).join(""), "i").test(from)));
  if (bySchool.length && kind !== "fyi") return bySchool;
  return [];
}

function extractAgeRange(text: string): { min: number; max: number } | undefined {
  const m = /\(?ages?\s*(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\)?|\((\d{1,2})\s*-\s*(\d{1,2})\)|(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*year[- ]olds/i.exec(text);
  if (!m) return undefined;
  const min = Number(m[1] ?? m[3] ?? m[5]);
  const max = Number(m[2] ?? m[4] ?? m[6]);
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : undefined;
}

// ───────────────────────────── dates & times ─────────────────────────────

export function extractDates(text: string, now: LocalDateTime): DateMention[] {
  const out: DateMention[] = [];
  let masked = text;
  const mask = (index: number, length: number) => {
    masked = masked.slice(0, index) + " ".repeat(length) + masked.slice(index + length);
  };
  const push = (index: number, length: number, day: LocalDateTime, raw: string, explicit = true) => {
    out.push({ index, length, day, raw, explicit });
    mask(index, length);
  };
  const year = fromLocal(now).getFullYear();
  const resolveYear = (y: string | undefined, month: number, day: number): LocalDateTime => {
    let yy = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : year;
    let d = new Date(yy, month, day);
    // Undated mentions more than two months in the past roll forward a year.
    if (!y && (fromLocal(now).getTime() - d.getTime()) / 86400000 > 60) d = new Date(yy + 1, month, day);
    return toLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  };

  // "Thursday 10 September 2026", "10 Sept", "10th of September"
  const dmy = new RegExp(`(?:${WEEKDAY_RE}\\.?,?\\s+)?\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+${MONTH_RE}\\b\\.?(?:,?\\s+(\\d{4}))?`, "gi");
  for (const m of masked.matchAll(dmy)) {
    push(m.index!, m[0].length, resolveYear(m[4], MONTHS.indexOf(m[3].slice(0, 3).toLowerCase()), Number(m[2])), m[0]);
  }
  // "September 10", "Sept 10th, 2026"
  const mdy = new RegExp(`(?:${WEEKDAY_RE}\\.?,?\\s+)?\\b${MONTH_RE}\\b\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`, "gi");
  for (const m of masked.matchAll(mdy)) {
    if (/^\s*$/.test(m[0])) continue;
    push(m.index!, m[0].length, resolveYear(m[4], MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()), Number(m[3])), m[0]);
  }
  // "10/9" or "10/09/2026" (day first)
  for (const m of masked.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    const day = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month < 0 || month > 11 || day < 1 || day > 31) continue;
    push(m.index!, m[0].length, resolveYear(m[3], month, day), m[0]);
  }
  // "this Saturday", "next Friday", "Sat", "tomorrow"
  const rel = new RegExp(`\\b(?:(this|next)\\s+)?${WEEKDAY_RE}\\b(?:'s)?`, "gi");
  for (const m of masked.matchAll(rel)) {
    const target = WEEKDAYS.indexOf(m[2].slice(0, 3).toLowerCase());
    const today = weekdayOf(now);
    let ahead = (target - today + 7) % 7;
    if (ahead === 0) ahead = 7;
    if (m[1]?.toLowerCase() === "next" && ahead < 3) ahead += 7;
    push(m.index!, m[0].length, dateOf(addDays(now, ahead)) + "T00:00", m[0], false);
  }
  for (const m of masked.matchAll(/\btomorrow\b/gi)) push(m.index!, m[0].length, dateOf(addDays(now, 1)) + "T00:00", m[0], false);
  for (const m of masked.matchAll(/\btoday\b|\btonight\b/gi)) push(m.index!, m[0].length, dateOf(now) + "T00:00", m[0], false);
  return out.sort((a, b) => a.index - b.index);
}

const TIME = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?";

function toHHMM(h: string, m: string | undefined, ampm: string | undefined, inherit?: string): string | undefined {
  let hh = Number(h);
  const suffix = (ampm ?? inherit)?.toLowerCase();
  if (!suffix && !m) return undefined; // bare numbers like "6" are too ambiguous
  if (suffix === "pm" && hh < 12) hh += 12;
  if (suffix === "am" && hh === 12) hh = 0;
  if (hh > 23) return undefined;
  return `${String(hh).padStart(2, "0")}:${m ?? "00"}`;
}

export function extractTimes(text: string): { times: TimeMention[]; moved?: { index: number; from: string; to: string } } {
  const times: TimeMention[] = [];
  let masked = text;
  let moved: { index: number; from: string; to: string } | undefined;
  const mask = (index: number, length: number) => {
    masked = masked.slice(0, index) + " ".repeat(length) + masked.slice(index + length);
  };
  const movedRe = new RegExp(`(?:moved|changed|rescheduled|shifted|pushed)\\s+(?:back\\s+|forward\\s+)?from\\s+${TIME}\\s+(?:to|→)\\s+${TIME}`, "i");
  const mm = movedRe.exec(masked);
  if (mm) {
    const to = toHHMM(mm[4], mm[5], mm[6]);
    const from = toHHMM(mm[1], mm[2], mm[3], mm[6]);
    if (from && to) {
      moved = { index: mm.index, from, to };
      mask(mm.index, mm[0].length);
    }
  }
  const rangeRe = new RegExp(`\\b${TIME}\\s*(?:-|–|to|until|till)\\s*${TIME}\\b`, "gi");
  for (const m of masked.matchAll(rangeRe)) {
    const end = toHHMM(m[4], m[5], m[6]);
    const start = toHHMM(m[1], m[2], m[3], m[6]);
    if (!start || !end) continue;
    times.push({ index: m.index!, length: m[0].length, start, end, raw: m[0] });
    mask(m.index!, m[0].length);
  }
  const singleRe = new RegExp(`\\b${TIME}\\b`, "gi");
  for (const m of masked.matchAll(singleRe)) {
    const t = toHHMM(m[1], m[2], m[3]);
    if (!t) continue;
    times.push({ index: m.index!, length: m[0].length, start: t, raw: m[0] });
  }
  return { times: times.sort((a, b) => a.index - b.index), moved };
}

function findDeadline(text: string, dates: DateMention[]): DateMention | undefined {
  for (const d of dates) {
    const before = text.slice(Math.max(0, d.index - 30), d.index).toLowerCase();
    const m = /\b(by|before|due|close[sd]?|no later than|deadline)\b([^.]*)$/.exec(before);
    if (m && !/\d{1,2}(?::\d{2})?\s*(am|pm)/.test(m[2])) return d;
  }
  return undefined;
}

function buildWindow(text: string, dates: DateMention[], times: TimeMention[], moved: { index: number; from: string; to: string } | undefined, kind: SignalKind): { when?: TimeWindow; previousWhen?: TimeWindow } {
  if (kind === "purchase_need") return {};
  if (moved) {
    const day = [...dates].filter((d) => d.index < moved.index).pop() ?? dates[0];
    if (!day) return {};
    const start = `${dateOf(day.day)}T${moved.to}`;
    return { when: { start, end: addMinutes(start, 60) }, previousWhen: { start: `${dateOf(day.day)}T${moved.from}`, end: addMinutes(`${dateOf(day.day)}T${moved.from}`, 60) } };
  }
  const day = dates.find((d) => d.explicit) ?? dates[0];
  if (!day) return {};
  const paragraphEnd = (() => {
    const i = text.indexOf("\n\n", day.index);
    return i === -1 ? text.length : i;
  })();
  const sentenceStart = Math.max(text.lastIndexOf(". ", day.index), text.lastIndexOf("\n", day.index), 0);
  const sentenceEndIdx = text.indexOf(". ", day.index);
  const sentenceEnd = sentenceEndIdx === -1 ? text.length : sentenceEndIdx;
  const sameSentence = times.filter((t) => t.index >= sentenceStart && t.index <= sentenceEnd);
  const after = times.filter((t) => t.index > day.index && t.index < paragraphEnd);
  const pick = sameSentence.length ? sameSentence : after.length ? after : times;
  const first = pick[0];
  if (!first) return { when: { start: day.day, allDay: true } };
  const start = `${dateOf(day.day)}T${first.start}`;
  if (first.end) return { when: { start, end: `${dateOf(day.day)}T${first.end}` } };
  const second = pick[1];
  if (second && !second.end && second.start > first.start && kind !== "coparent_message") {
    return { when: { start, end: `${dateOf(day.day)}T${second.start}` } };
  }
  return { when: { start, end: addMinutes(start, kind === "appointment" ? 45 : 60) } };
}

// ───────────────────────────── other fields ─────────────────────────────

function detectLocation(text: string, h: Household): { text?: string; placeId?: string; travelMinutes?: number } {
  let best: { index: number; place: (typeof h.places)[number] } | undefined;
  for (const p of h.places) {
    if (p.id === "pl_home") continue;
    for (const n of [p.name, ...(p.aliases ?? [])]) {
      const m = new RegExp(`\\b${escape(n)}\\b`, "i").exec(text);
      if (m && (!best || m.index < best.index)) best = { index: m.index, place: p };
    }
  }
  if (best) return { text: best.place.name, placeId: best.place.id, travelMinutes: best.place.travelMinutesFromHome };
  const m = /\bat (?:the )?([A-Z][A-Za-z'’]+(?:\s+[A-Z][A-Za-z'’]+){0,4})/.exec(text);
  if (m && !new RegExp(`^${WEEKDAY_RE}|^${MONTH_RE}`, "i").test(m[1]) && !h.people.some((p) => p.name === m[1])) return { text: m[1] };
  return {};
}

function extractItems(text: string): string[] {
  const items: string[] = [];
  const bring = /\bbring\s+(?:a |an |the |her |his |their |your )?([^.\n]+)/gi;
  for (const m of text.matchAll(bring)) {
    const part = m[1].replace(/\s+(and|&)\s+/g, ",").split(",").map((s) => s.trim().replace(/^(a|an|the|her|his|their|your)\s+/i, "")).filter(Boolean);
    items.push(...part);
  }
  for (const m of text.matchAll(/\b([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(?:are|is)?\s*required\b/gi)) items.push(m[1].toLowerCase());
  return [...new Set(items.map((i) => i.replace(/\s+/g, " ")))];
}

function extractContact(text: string, from: string): { name?: string; phone?: string } | undefined {
  const phone = /\b(0\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4})\b/.exec(text)?.[1];
  const name = /rsvp[^.]*?\bto\s+([A-Z][a-z]+)/i.exec(text)?.[1] ?? (from.includes("@") ? undefined : from.replace(/\s*\(.*\)\s*$/, ""));
  if (!phone && !name) return undefined;
  return { name, phone };
}

export function analyseTone(text: string, speaker = "the other parent", childName = "the child"): { hostile: boolean; score: number; facts: string[]; neutralised: string } {
  const caps = (text.match(/\b[A-Z]{3,}\b/g) ?? []).filter((w) => !["RSVP", "PDF", "LEGO", "SMS"].includes(w));
  const score = HOSTILE.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0) + caps.length;
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const factual = /\d|\b(need|needs|bring|pick|drop|folder|homework|bag|pm|am|friday|monday|tuesday|wednesday|thursday|saturday|sunday|weekend|school|appointment|medic)/i;
  const facts: string[] = [];
  for (const s of sentences) {
    if (!factual.test(s)) continue;
    let clean = s
      .replace(/\byou\s+(?:again\s+)?forgot\s+to\s+(?:send|pack|bring)\s+(.+?)(\s+last\s+\w+)?\.?$/i, "$1 was not sent$2.")
      .replace(/\bat mine\b/gi, `at ${speaker}'s`)
      .replace(/\bI need (her|him|them)\b/gi, `${speaker} needs ${childName}`)
      .replace(/\bnot (\d{1,2}(?::\d{2})?(?:am|pm)?)\b/gi, "(not $1)")
      .replace(/\b(again|typical|as usual|always|never|ridiculous|unbelievable)\b/gi, "")
      .replace(/\b(this is|that is|that's)\s*\.?/gi, "")
      .replace(/\byou\s+forgot\b/gi, "the")
      .replace(/\bi have plans\b/gi, "")
      .replace(/\bmake sure\b/gi, "please ensure")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.])/g, "$1")
      .replace(/,\s*\./g, ".")
      .trim();
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (clean.length > 3) facts.push(clean);
  }
  return { hostile: score >= 2, score, facts, neutralised: facts.join(" ") };
}

function requirementsFor(kind: SignalKind, ctx: { amount?: number; items: string[]; when?: TimeWindow; hasReply: boolean }): Requirement[] {
  const r: Requirement[] = [];
  const add = (...xs: Requirement[]) => xs.forEach((x) => !r.includes(x) && r.push(x));
  switch (kind) {
    case "permission_request":
      add("signature");
      if (ctx.amount) add("payment");
      if (ctx.items.length) add("item");
      break;
    case "schedule_change":
      add("transport");
      break;
    case "invitation":
      add("rsvp", "purchase", "transport");
      if (ctx.items.length) add("item");
      break;
    case "appointment":
      add("transport");
      if (ctx.items.length) add("item");
      if (ctx.hasReply) add("reply");
      break;
    case "purchase_need":
      add("purchase");
      break;
    case "registration":
      add("decision");
      if (ctx.amount) add("payment");
      break;
    case "coparent_message":
      add("reply", "decision");
      break;
    case "event":
      add("transport");
      if (ctx.items.length) add("item");
      break;
    case "fyi":
      break;
  }
  return r;
}

function payeeFor(kind: SignalKind, from: string, h: Household, placeId?: string): string | undefined {
  if (!["permission_request", "registration", "purchase_need", "appointment"].includes(kind)) return undefined;
  const place = h.places.find((p) => p.id === placeId && p.verifiedPayee);
  if (place && kind !== "permission_request") return place.name;
  const domain = /@([\w.-]+)/.exec(from)?.[1];
  const school = h.places.find((p) => domain && p.verifiedPayee && p.name.toLowerCase().split(" ")[0] === domain.split(".")[0].replace(/ps$/, ""));
  return school?.name ?? domain ?? from;
}

function makeTitle(kind: SignalKind, raw: RawMessage, children: Person[], h: Household, location: string | undefined, tags: string[]): string {
  const who = children.map((c) => c.name).join(" & ") || "Family";
  const subject = raw.subject?.replace(/\s+[-–—]\s+.*$/, "").trim();
  switch (kind) {
    case "permission_request":
      return subject ? `${who}: ${subject}` : `${who}: permission needed`;
    case "schedule_change":
      return `${who}: ${tags[0] ?? "activity"} time changed`;
    case "invitation":
      return `${who}: party invitation${location ? ` at ${location}` : ""}`;
    case "appointment":
      return `${who}: appointment${location ? ` at ${location}` : ""}`;
    case "purchase_need":
      return subject ? `${who}: ${subject}` : `${who}: something to buy`;
    case "registration":
      return `${who}: ${subject ?? `${tags[0] ?? "activity"} registration`}`;
    case "coparent_message":
      return `${who}: message from ${raw.from}`;
    case "event": {
      const noun = EVENT_RE.exec(raw.subject + " " + raw.body)?.[1].toLowerCase() ?? "event";
      return `${who}: ${noun}${location ? ` at ${location}` : ""}`;
    }
    default:
      return subject ?? `${raw.from}: note`;
  }
}

function scoreConfidence(kind: SignalKind, children: number, when: TimeWindow | undefined, deadline: DateMention | undefined): number {
  let c = kind === "fyi" ? 0.6 : 0.7;
  if (children > 0) c += 0.1;
  if (when) c += 0.1;
  if (deadline) c += 0.05;
  return Math.min(0.98, c);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
