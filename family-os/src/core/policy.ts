import type { Household, Person, Policy, Flag, Extracted, StandingCommitment, ActivityCategory } from "./types.ts";
import { timeOf, isWeekend, weekdayOf, dateOf } from "./time.ts";

export function policy(h: Household, kind: Policy["kind"]): Policy | undefined {
  return h.policies.find((p) => p.kind === kind && p.enabled);
}

export function childById(h: Household, id: string): Person | undefined {
  return h.people.find((p) => p.id === id);
}

export function num(p: Policy | undefined, key: string, fallback: number): number {
  const v = p?.params[key];
  return typeof v === "number" ? v : fallback;
}

/** Policies that speak to a single event: travel, evenings, allergens, custody. */
export function evaluateEventPolicies(h: Household, ex: Extracted, opts: { recurring: boolean; foodAdjacent: boolean }): Flag[] {
  const flags: Flag[] = [];
  const radius = policy(h, "transit_radius");
  if (radius && ex.when && ex.travelMinutes !== undefined) {
    const max = num(radius, "maxMinutes", 30);
    if (isWeekend(ex.when.start) && ex.travelMinutes > max) {
      flags.push({
        level: opts.recurring ? "warn" : "info",
        policyId: radius.id,
        message: opts.recurring
          ? `${ex.travelMinutes} min each way is outside your ${max}-minute weekend radius.`
          : `${ex.travelMinutes} min each way (one-off, so the ${max}-minute weekend rule is only a heads-up).`,
      });
    }
  }
  const evening = policy(h, "evening_cutoff");
  if (evening && ex.when?.end) {
    const cutoff = String(evening.params.cutoff ?? "18:30");
    const maxAge = num(evening, "maxAge", 5);
    const day = weekdayOf(ex.when.start);
    const schoolNight = day >= 0 && day <= 4;
    for (const cid of ex.childIds) {
      const c = childById(h, cid);
      if (c?.age !== undefined && c.age <= maxAge && schoolNight && timeOf(ex.when.end) > cutoff) {
        flags.push({ level: "warn", policyId: evening.id, message: `${c.name} would be out past ${cutoff} on a school night.` });
      }
    }
  }
  const allergen = policy(h, "allergen");
  if (allergen && opts.foodAdjacent && ex.childIds.includes(String(allergen.params.childId))) {
    const c = childById(h, String(allergen.params.childId));
    flags.push({ level: "warn", policyId: allergen.id, message: `${c?.name} has a ${(allergen.params.allergens as string[]).join(" and ")} allergy. Say so wherever food is involved.` });
  }
  const custody = policy(h, "custody");
  if (custody && ex.when && ex.childIds.includes(String(custody.params.childId))) {
    const c = childById(h, String(custody.params.childId));
    const cop = childById(h, String(custody.params.coparentId));
    if (isOnCoparentWeekend(custody, ex.when.start)) {
      flags.push({ level: "info", policyId: custody.id, message: `${c?.name} is with ${cop?.name} that weekend. Coordinate through the shared ledger.` });
    }
  }
  return flags;
}

export function isOnCoparentWeekend(custody: Policy, at: string): boolean {
  const next = String(custody.params.nextHandover ?? "");
  if (!next) return false;
  const day = weekdayOf(at);
  if (!(day === 5 || day === 6 || day === 0)) return false;
  // Find the Friday of the week containing `at`.
  const d = new Date(dateOf(at));
  const offsetToFriday = day === 5 ? 0 : day === 6 ? -1 : -2;
  d.setDate(d.getDate() + offsetToFriday);
  const friday = d.toISOString().slice(0, 10);
  const weeks = Math.round((new Date(friday).getTime() - new Date(next).getTime()) / (7 * 86400000));
  return weeks % 2 === 0;
}

/** Policies about the shape of a child's season: caps and minimums per category. */
export function evaluateLoadPolicies(h: Household, childId: string, proposed: { category: ActivityCategory; from: string; to: string }): Flag[] {
  const flags: Flag[] = [];
  const active = h.standing.filter((s) => s.personId === childId && seasonOverlaps(s, proposed.from, proposed.to));
  const max = policy(h, "max_activities");
  if (max) {
    const structured = active.filter((s) => s.category === "sport" || s.category === "creative" || s.category === "academic");
    const cap = num(max, "max", 2);
    if (structured.length + 1 > cap) {
      flags.push({ level: "warn", policyId: max.id, message: `Would be activity ${structured.length + 1} of ${cap} for the season (${structured.map((s) => s.title).join(", ")}).` });
    } else {
      flags.push({ level: "info", policyId: max.id, message: `Fits the ${cap}-activity cap (${structured.length} already in that season).` });
    }
  }
  const creative = policy(h, "one_per_category");
  if (creative && proposed.category !== "creative") {
    const has = active.some((s) => s.category === "creative");
    if (!has) flags.push({ level: "info", policyId: creative.id, message: "No creative program that term yet. Worth balancing." });
  }
  return flags;
}

function seasonOverlaps(s: StandingCommitment, from: string, to: string): boolean {
  if (!s.season) return true;
  return s.season.from <= to && from <= s.season.to;
}

export function autoPayCap(h: Household): number {
  return num(policy(h, "auto_pay_cap"), "maxAmount", 0);
}

export function giftCap(h: Household): number {
  return num(policy(h, "gift_cap"), "maxAmount", 30);
}

export function monthlyBudget(h: Household): number {
  return num(policy(h, "budget"), "monthly", Infinity);
}
