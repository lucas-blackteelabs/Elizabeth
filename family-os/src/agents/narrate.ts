import type { BriefItem } from "../core/types.ts";

/**
 * The brief speaks in the first person, like a person who did the work would.
 * "I've added it to the calendar and paid the $38. I just need your signature."
 */

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const word = (n: number) => WORDS[n] ?? String(n);

function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function list(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

type A = BriefItem["actions"][number];

function did(a: A): string {
  switch (a.cls) {
    case "calendar_write":
      if (/^Add /.test(a.title)) return `put ${lower(a.title.replace(/^Add /, ""))} on the calendar`;
      if (/^Move /.test(a.title)) return lower(a.title.replace(/^Move /, "moved "));
      if (/drives instead of/.test(a.title)) return a.title.replace(" drives instead of ", " is driving instead of ");
      if (/drives$/.test(a.title)) return a.title.replace(/ drives$/, " is driving");
      return lower(a.title);
    case "reminder":
      if (/^Pack: /.test(a.title)) return `set a reminder to pack ${a.title.replace(/^Pack: /, "")}`;
      if (/^Pack /.test(a.title)) return `set a reminder to ${lower(a.title)}`;
      return `set a reminder (${lower(a.title)})`;
    case "payment":
      return `paid $${a.amount}${/ to (.+)$/.test(a.title) ? ` to ${/ to (.+)$/.exec(a.title)![1]}` : ""}`;
    case "purchase":
      return `ordered ${lower(a.title)}`;
    case "outbound_message":
    case "coparent_reply":
      return `sent the ${/rsvp/i.test(a.title) ? "RSVP" : "reply"}`;
    case "enrolment":
      return lower(a.title).replace(/^enrol /, "enrolled ");
    case "sign_form":
      return "signed the note";
  }
}

function need(a: A): string {
  switch (a.cls) {
    case "sign_form":
      return "your signature";
    case "payment":
      return `a tap to pay $${a.amount}`;
    case "purchase":
      return /uniform/i.test(a.title) ? `a tap to order the uniforms (about $${a.amount})` : `a yes on the ${lower(a.title.replace(/:.*$/, ""))}`;
    case "outbound_message":
      return /rsvp/i.test(a.title) ? "your OK to send the RSVP" : /confirm/i.test(a.title) ? "your OK to confirm" : "your OK to send it";
    case "coparent_reply":
      return "you to read the draft and send it";
    case "enrolment":
      return `your call on ${lower(a.title).replace(/^enrol /, "enrolling ")}`;
    case "calendar_write":
      return `a yes to ${lower(a.title)}`;
    case "reminder":
      return "nothing";
  }
}

export function narrate(item: BriefItem): string {
  const done = item.actions.filter((a) => a.disposition === "executed").map(did);
  const pending = item.actions.filter((a) => a.disposition === "staged" || a.disposition === "suggested").map(need).filter((n) => n !== "nothing");
  const parts: string[] = [];
  if (done.length) parts.push(`I've ${list(done)}.`);
  if (pending.length) parts.push(`${done.length ? "I just need" : "I need"} ${list(pending)}.`);
  if (!done.length && !pending.length) parts.push(item.summary);
  return parts.join(" ");
}

export function headline(decide: number, automated: number, later: number): string {
  if (decide === 0) return automated ? `Nothing needs you tonight. I've handled ${word(automated)} thing${automated === 1 ? "" : "s"} quietly.` : "Nothing needs you tonight.";
  const a = `${decide === 1 ? "One thing needs" : `${cap(word(decide))} things need`} you tonight.`;
  const b = automated ? ` I've handled ${word(automated)} already` : "";
  const c = later ? `${b ? " and" : " I've"} parked ${word(later)} for later.` : b ? "." : "";
  return a + b + c;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
