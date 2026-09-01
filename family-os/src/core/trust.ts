import type { Action, ActionClass, Disposition, Household, TrustLevel, TrustSetting } from "./types.ts";
import { autoPayCap } from "./policy.ts";

export const TRUST_LABELS: Record<TrustLevel, string> = {
  0: "Observe",
  1: "Suggest",
  2: "Prepare",
  3: "Execute & notify",
  4: "Autonomous",
};

export const CLASS_LABELS: Record<ActionClass, string> = {
  calendar_write: "Calendar changes",
  reminder: "Reminders",
  sign_form: "Signing forms",
  payment: "Payments",
  outbound_message: "Messages to coaches, schools, other parents",
  coparent_reply: "Replies to co-parent",
  purchase: "Purchases",
  enrolment: "Enrolments and registrations",
};

/**
 * Starting posture. Low-stakes, reversible actions start high; anything
 * involving money, a signature, or another human starts at "prepare" or below.
 * Every approval moves the ladder up; every override moves it down.
 */
export function defaultTrust(h: Household): TrustSetting[] {
  return [
    { cls: "calendar_write", level: 3, approvals: 0, overrides: 0, pinned: false },
    { cls: "reminder", level: 4, approvals: 0, overrides: 0, pinned: false },
    { cls: "sign_form", level: 2, approvals: 0, overrides: 0, pinned: true },
    { cls: "payment", level: 2, approvals: 0, overrides: 0, pinned: false, conditions: { maxAmount: autoPayCap(h), verifiedPayeeOnly: true } },
    { cls: "outbound_message", level: 2, approvals: 0, overrides: 0, pinned: false },
    { cls: "coparent_reply", level: 1, approvals: 0, overrides: 0, pinned: false },
    { cls: "purchase", level: 2, approvals: 0, overrides: 0, pinned: false },
    { cls: "enrolment", level: 1, approvals: 0, overrides: 0, pinned: false },
  ];
}

export const PROMOTION_THRESHOLD = 3;

export function trustFor(settings: TrustSetting[], cls: ActionClass): TrustSetting {
  const t = settings.find((s) => s.cls === cls);
  if (!t) throw new Error(`No trust setting for ${cls}`);
  return t;
}

/** Decide what the platform may do with an action right now. */
export function dispose(settings: TrustSetting[], action: Action, ctx: { verifiedPayee: boolean }): { disposition: Disposition; reason: string } {
  const t = trustFor(settings, action.cls);
  let level = t.level;
  let reason = `${CLASS_LABELS[action.cls]} is at "${TRUST_LABELS[level]}"`;

  if (action.cls === "payment" && t.conditions) {
    const { maxAmount, verifiedPayeeOnly } = t.conditions;
    const amount = action.amount ?? Infinity;
    const withinCap = maxAmount !== undefined && amount <= maxAmount;
    const payeeOk = !verifiedPayeeOnly || ctx.verifiedPayee;
    if (withinCap && payeeOk && level >= 2) {
      level = 3;
      reason = `$${amount} to a verified payee is under your $${maxAmount} auto-pay cap`;
    } else if (!payeeOk) {
      level = Math.min(level, 2) as TrustLevel;
      reason = `payee is not yet verified, so payment is staged for one tap`;
    } else if (!withinCap) {
      level = Math.min(level, 2) as TrustLevel;
      reason = `$${amount} is over the $${maxAmount} auto-pay cap`;
    }
  }

  if (level >= 3) return { disposition: "executed", reason };
  if (level === 2) return { disposition: "staged", reason };
  if (level === 1) return { disposition: "suggested", reason };
  return { disposition: "observed", reason };
}

export function recordApproval(settings: TrustSetting[], cls: ActionClass): { promotionOffered: boolean } {
  const t = trustFor(settings, cls);
  t.approvals += 1;
  const promotionOffered = !t.pinned && t.level < 3 && t.approvals >= PROMOTION_THRESHOLD;
  return { promotionOffered };
}

export function recordOverride(settings: TrustSetting[], cls: ActionClass): void {
  const t = trustFor(settings, cls);
  t.overrides += 1;
  t.approvals = 0;
  if (!t.pinned && t.level > 1) t.level = (t.level - 1) as TrustLevel;
}

export function setLevel(settings: TrustSetting[], cls: ActionClass, level: TrustLevel, pinned?: boolean): void {
  const t = trustFor(settings, cls);
  t.level = level;
  t.approvals = 0;
  if (pinned !== undefined) t.pinned = pinned;
}
