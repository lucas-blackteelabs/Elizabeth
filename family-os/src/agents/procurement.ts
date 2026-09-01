import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace, personName } from "../core/state.ts";
import { addDays, dateOf, fmtDay, withTime } from "../core/time.ts";
import { giftCap } from "../core/policy.ts";
import { action, empty, type AgentOutput } from "./shared.ts";

const AGENT = "procurement";

/** Closes the loop on money and stuff: fees, gifts, gear, and the things that must be in the bag. */
export function procurement(state: State, signal: Signal): AgentOutput {
  const out = empty();
  const ex = signal.extracted;
  const h = state.household;
  const kids = ex.childIds.map((id) => h.people.find((p) => p.id === id)!).filter(Boolean);
  const nightBefore = (day: string) => withTime(addDays(day, -1), "19:30");

  // Fees attached to a permission slip or appointment.
  if (signal.kind === "permission_request" && ex.amount) {
    out.actions.push(action(AGENT, "payment", `Pay $${ex.amount} to ${ex.payee}`, `Excursion fee via the school portal.`, { amount: ex.amount, payee: ex.payee, payload: { amount: ex.amount, payee: ex.payee } }));
  }

  // Things that have to be in the bag.
  if (ex.items.length && ex.when) {
    const allergic = kids.find((k) => k.allergies?.length);
    const items = ex.items.map((i) => (allergic && /lunch|snack/i.test(i) ? `${i} (nut-free for ${allergic.name})` : i));
    out.actions.push(action(AGENT, "reminder", `Pack: ${items.join(", ")}`, `Reminder ${fmtDay(nightBefore(ex.when.start))} 7:30pm.`, { payload: { at: nightBefore(ex.when.start), text: `${kids.map((k) => k.name).join(" & ")}: pack ${items.join(", ")}`, personIds: h.people.filter((p) => p.role === "parent").map((p) => p.id) } }));
    out.rationale.push(`Packing reminder set for the night before.`);
  }

  // Gifts.
  if (signal.kind === "invitation") {
    const cap = giftCap(h);
    const kid = kids[0];
    const idea = (h.preferences.giftIdeas ?? []).find((g) => kid?.interests?.some((i) => i.toLowerCase().includes(g.toLowerCase()))) ?? h.preferences.giftIdeas?.[0] ?? "a book";
    const host = /\b([A-Z][a-z]+) is turning (\d+)/.exec(signal.raw.body);
    const age = host ? Number(host[2]) : kid?.age;
    out.actions.push(action(AGENT, "purchase", `Gift under $${cap}: ${idea} for ${host?.[1] ?? "the birthday child"}${age ? ` (turning ${age})` : ""}`, `Matched to what ${kid?.name} likes; delivered by ${fmtDay(addDays(ex.when?.start ?? state.clock.now(), -2))}.`, { amount: cap, payload: { items: [idea], estimate: cap } }));
    out.rationale.push(`Gift budget policy is $${cap}. ${idea} suits ${age ? `${/^[8]$|^1[18]$/.test(String(age)) ? "an" : "a"} ${age}-year-old` : "the age"} and is on your usual list.`);
  }

  // Growth life-cycling: sizes drift, so order ahead.
  if (signal.kind === "purchase_need") {
    const prices = [...signal.raw.body.matchAll(/([A-Za-z ]+?)\s+\$(\d+)/g)].map((m) => ({ item: m[1].trim().toLowerCase(), price: Number(m[2]) }));
    const sizeUp = /size up|run small|outgrow/i.test(signal.raw.body);
    let total = 0;
    const lines: string[] = [];
    for (const kid of kids) {
      const rec = kid.sizes?.["school uniform"];
      if (!rec) continue;
      const monthsSince = Math.round((new Date(dateOf(state.clock.now())).getTime() - new Date(rec.recordedOn).getTime()) / (30 * 86400000));
      // Kids' sizing steps by 2; one step up after six months or when the shop says sizes run small.
      const next = String(Number(rec.size) + (monthsSince >= 6 || sizeUp ? 2 : 0));
      if (next === rec.size) continue;
      const wanted = prices.filter((p) => /polo|shorts?/.test(p.item));
      const est = wanted.reduce((a, p) => a + p.price * 2, 0) || 100;
      total += est;
      lines.push(`${kid.name}: size ${next} (was ${rec.size} in ${rec.recordedOn.slice(0, 7)}, ${monthsSince} months ago${sizeUp ? ", shop says sizes run small" : ""}) · 2 polos + 2 shorts ≈ $${est}`);
    }
    if (lines.length) {
      out.actions.push(action(AGENT, "purchase", `Order summer uniforms (≈ $${total})`, lines.join("\n"), { amount: total, payee: ex.payee, payload: { items: lines, estimate: total } }));
      if (ex.deadline) out.actions.push(action(AGENT, "reminder", `Uniform order closes ${fmtDay(ex.deadline)}`, "Nudge two days before the cut-off if not yet ordered.", { payload: { at: withTime(addDays(ex.deadline, -2), "19:30"), text: "Uniform orders close in two days", personIds: h.people.filter((p) => p.role === "parent").map((p) => p.id) } }));
      out.rationale.push(...lines);
    }
  }

  if (out.actions.length) trace(state, signal.id, AGENT, "supply", out.rationale.join(" ") || out.actions.map((a) => a.title).join("; "));
  return out;
}
