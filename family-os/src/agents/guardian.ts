import type { Signal } from "../core/types.ts";
import type { State } from "../core/state.ts";
import { monthSpend, trace } from "../core/state.ts";
import { monthlyBudget, policy } from "../core/policy.ts";
import type { AgentOutput } from "./shared.ts";

const AGENT = "guardian";

/**
 * The guardian never proposes; it checks. Budget, allergen wording, and
 * anything a parent would be upset to discover was done without them.
 */
export function guardian(state: State, signal: Signal, combined: AgentOutput): AgentOutput {
  const h = state.household;
  const ex = signal.extracted;
  const month = (ex.when?.start ?? state.clock.now()).slice(0, 7);
  const budget = monthlyBudget(h);
  const spent = monthSpend(state, month);
  const proposed = combined.actions.filter((a) => a.cls === "payment" || a.cls === "purchase" || a.cls === "enrolment").reduce((s, a) => s + (a.amount ?? 0), 0);
  const notes: string[] = [];

  if (proposed > 0 && Number.isFinite(budget)) {
    const remaining = budget - spent - proposed;
    if (remaining < 0) {
      combined.flags.push({ level: "block", policyId: policy(h, "budget")?.id, message: `Would exceed the $${budget} ${month} activities budget by $${-remaining}.` });
    } else {
      combined.flags.push({ level: "info", policyId: policy(h, "budget")?.id, message: `Leaves $${remaining} of the $${budget} ${month} budget.` });
    }
    notes.push(`Budget check: $${proposed} proposed, $${spent} already committed in ${month}.`);
  }

  const allergen = policy(h, "allergen");
  if (allergen && ex.childIds.includes(String(allergen.params.childId))) {
    for (const a of combined.actions.filter((a) => a.cls === "outbound_message")) {
      if (!/allerg/i.test(a.detail)) combined.flags.push({ level: "block", policyId: allergen.id, message: `Outbound message does not mention the allergy. Not sending.` });
      else notes.push("Allergy stated in the outbound message.");
    }
  }

  if (ex.tone?.hostile) {
    combined.flags.push({ level: "info", message: "Hostile tone detected. You see only the facts; the reply stays a draft until you send it." });
  }

  for (const a of combined.actions.filter((a) => a.cls === "payment")) {
    const verified = h.places.some((p) => p.verifiedPayee && p.name === a.payee);
    if (!verified) combined.flags.push({ level: "info", message: `${a.payee} is not a verified payee yet; payment will wait for your tap.` });
  }

  if (notes.length) trace(state, signal.id, AGENT, "check", notes.join(" "));
  return combined;
}
