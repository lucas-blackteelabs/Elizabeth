import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { trace, personName } from "../core/state.ts";
import { fmtDay, fmtTime } from "../core/time.ts";
import { action, empty, type AgentOutput } from "./shared.ts";
import type { SchedulePlan } from "./scheduler.ts";

const AGENT = "comms";

/** Drafts every outbound word: RSVPs, confirmations, and the calm reply to the co-parent. */
export function comms(state: State, signal: Signal, plan: SchedulePlan): AgentOutput {
  const out = empty();
  const ex = signal.extracted;
  const h = state.household;
  const parent = h.people.find((p) => p.role === "parent")!;
  const kids = ex.childIds.map((id) => h.people.find((p) => p.id === id)!).filter(Boolean);
  const kid = kids[0];

  if (signal.kind === "permission_request") {
    out.actions.push(action(AGENT, "sign_form", `Sign permission note for ${kid?.name}`, `Pre-filled from the school portal. Emergency contact and medical details carried over.`, { payload: { form: signal.raw.subject } }));
  }

  if (signal.kind === "invitation" && ex.when) {
    const allergy = kid?.allergies?.length ? ` One thing to flag: ${kid.name} has a ${kid.allergies.join(" and ")} allergy, so we'll send some safe snacks and I'll double-check the pizza and cake. ` : " ";
    const host = /\b([A-Z][a-z]+) is turning/.exec(signal.raw.body)?.[1] ?? ex.contact?.name ?? "the birthday child";
    const text = `Hi ${ex.contact?.name ?? "there"}! ${kid?.name} would love to come to ${host}'s party on ${fmtDay(ex.when.start)}, ${fmtTime(ex.when.start)}–${fmtTime(ex.when.end ?? ex.when.start)}.${allergy}Thanks so much for the invite! ${parent.name}`;
    out.actions.push(action(AGENT, "outbound_message", `RSVP yes to ${ex.contact?.name ?? signal.raw.from}`, text, { payload: { to: ex.contact?.phone ?? signal.raw.from, channel: signal.raw.channel, text } }));
    out.alternatives.push({ label: "Send a warm no", detail: "Decline the invitation kindly.", actions: [action(AGENT, "outbound_message", "RSVP no", `Hi ${ex.contact?.name ?? "there"}, thank you so much for thinking of ${kid?.name}. Sadly we can't make it that day, but we hope ${host} has the best birthday! ${parent.name}`, { payload: { to: ex.contact?.phone ?? signal.raw.from, channel: signal.raw.channel } })] });
  }

  if (signal.kind === "appointment" && ex.requires.includes("reply")) {
    const reply = /reply\s+([A-Z])\b/i.exec(signal.raw.body)?.[1]?.toUpperCase() ?? "Y";
    out.actions.push(action(AGENT, "outbound_message", `Confirm appointment (reply "${reply}")`, `"${reply}" to ${signal.raw.from} by ${signal.raw.channel.toUpperCase()}`, { payload: { to: signal.raw.from, channel: signal.raw.channel, text: reply } }));
  }

  if (signal.kind === "coparent_message") {
    const cop = h.people.find((p) => p.role === "coparent");
    const facts = ex.tone?.facts ?? [];
    const requested = ex.when ? fmtTime(ex.when.start) : undefined;
    const feasible = plan.earliestFeasible ? fmtTime(plan.earliestFeasible) : undefined;
    const busy = plan.rationale.find((r) => /until/.test(r));
    const lines: string[] = [`Hi ${cop?.name ?? signal.raw.from}.`];
    if (/folder|homework/i.test(signal.raw.body)) lines.push(`Noted on the maths folder. It will be in ${kid?.name}'s bag on Friday.`);
    if (requested && feasible && feasible !== requested) {
      lines.push(`Friday: ${busy ? busy.replace(/;.*$/, "").replace(/^\w+ has /, `${kid?.name} has `) : `${kid?.name} has an activity`}, so the earliest I can have ${kid?.name} at yours is ${feasible}. Does ${feasible} work?`);
    } else if (requested) {
      lines.push(`${requested} on Friday works. See you then.`);
    }
    lines.push(parent.name);
    const text = lines.join(" ");
    out.actions.push(action(AGENT, "coparent_reply", `Reply to ${cop?.name ?? signal.raw.from}${feasible && feasible !== requested ? ` proposing ${feasible}` : ""}`, text, { payload: { to: cop?.phone ?? signal.raw.from, channel: signal.raw.channel, text } }));
    if (requested && feasible && feasible !== requested) {
      out.alternatives.push({ label: `Accept ${requested} and skip the activity`, detail: `Tell the studio ${kid?.name} will miss this week.`, actions: [action(AGENT, "coparent_reply", `Reply accepting ${requested}`, `Hi ${cop?.name}. ${requested} Friday is fine; ${kid?.name} will skip her lesson this week. The maths folder will be in her bag. ${parent.name}`, { payload: { to: cop?.phone ?? signal.raw.from, channel: signal.raw.channel } })] });
      out.alternatives.push({ label: "Keep the usual time", detail: "Politely hold the agreed handover.", actions: [action(AGENT, "coparent_reply", "Reply keeping the usual handover", `Hi ${cop?.name}. This Friday I can't do earlier than the usual 6pm, sorry. The maths folder will be in her bag. ${parent.name}`, { payload: { to: cop?.phone ?? signal.raw.from, channel: signal.raw.channel } })] });
    }
    if (/folder|homework/i.test(signal.raw.body) && ex.when) {
      out.actions.push(action(AGENT, "reminder", `Pack ${kid?.name}'s maths homework folder`, `Reminder the night before handover.`, { payload: { at: `${ex.when.start.slice(0, 10)}T07:30`, text: `${kid?.name}: maths homework folder in bag for ${cop?.name}'s`, personIds: h.people.filter((p) => p.role === "parent").map((p) => p.id) } }));
    }
    out.rationale.push(`Original message stripped to facts: ${facts.join(" ")}`);
    out.summary = facts.join(" ");
  }

  if (out.actions.length) trace(state, signal.id, AGENT, "draft", out.actions.map((a) => a.title).join("; "));
  return out;
}
