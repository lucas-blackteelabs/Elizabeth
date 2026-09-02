package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.TrustSetting;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Disposition;

import java.util.ArrayList;
import java.util.List;

/** Autonomy is earned per action class. Every approval moves a rung up; every override moves it down. */
public final class TrustPolicy {
    private TrustPolicy() {
    }

    public record Decision(Disposition disposition, String reason) {
    }

    public static List<TrustSetting> defaults(Household h) {
        int cap = PolicyRules.autoPayCap(h);
        List<TrustSetting> t = new ArrayList<>();
        t.add(TrustSetting.builder().cls(ActionClass.CALENDAR_WRITE).level(3).build());
        t.add(TrustSetting.builder().cls(ActionClass.REMINDER).level(4).build());
        t.add(TrustSetting.builder().cls(ActionClass.SIGN_FORM).level(2).pinned(true).build());
        t.add(TrustSetting.builder().cls(ActionClass.PAYMENT).level(2).maxAmount(cap).verifiedPayeeOnly(true).build());
        t.add(TrustSetting.builder().cls(ActionClass.OUTBOUND_MESSAGE).level(2).build());
        t.add(TrustSetting.builder().cls(ActionClass.COPARENT_REPLY).level(1).build());
        t.add(TrustSetting.builder().cls(ActionClass.PURCHASE).level(2).build());
        t.add(TrustSetting.builder().cls(ActionClass.ENROLMENT).level(1).build());
        return t;
    }

    public static Decision dispose(Household h, Action action, boolean verifiedPayee) {
        TrustSetting t = h.trust(action.getCls());
        int level = t.getLevel();
        String reason = action.getCls().label + " is at \"" + TrustSetting.LABELS[level] + "\"";
        if (action.getCls() == ActionClass.PAYMENT && t.getMaxAmount() != null) {
            double amount = action.getAmount() == null ? Double.MAX_VALUE : action.getAmount();
            boolean withinCap = amount <= t.getMaxAmount();
            boolean payeeOk = !t.isVerifiedPayeeOnly() || verifiedPayee;
            if (withinCap && payeeOk && level >= 2) {
                level = 3;
                reason = "$" + (long) amount + " to a verified payee is under your $" + t.getMaxAmount() + " auto-pay cap";
            } else if (!payeeOk) {
                level = Math.min(level, 2);
                reason = "payee is not yet verified, so payment is staged for one tap";
            } else if (!withinCap) {
                level = Math.min(level, 2);
                reason = "$" + (long) amount + " is over the $" + t.getMaxAmount() + " auto-pay cap";
            }
        }
        Disposition d = level >= 3 ? Disposition.EXECUTED : level == 2 ? Disposition.STAGED : level == 1 ? Disposition.SUGGESTED : Disposition.OBSERVED;
        return new Decision(d, reason);
    }

    /** Returns true when the class has earned an offer to move up. */
    public static boolean recordApproval(Household h, ActionClass cls) {
        TrustSetting t = h.trust(cls);
        t.setApprovals(t.getApprovals() + 1);
        return !t.isPinned() && t.getLevel() < 3 && t.getApprovals() >= TrustSetting.PROMOTION_THRESHOLD;
    }

    public static void recordOverride(Household h, ActionClass cls) {
        TrustSetting t = h.trust(cls);
        t.setOverrides(t.getOverrides() + 1);
        t.setApprovals(0);
        if (!t.isPinned() && t.getLevel() > 1) t.setLevel(t.getLevel() - 1);
    }

    public static void setLevel(Household h, ActionClass cls, int level, Boolean pinned) {
        TrustSetting t = h.trust(cls);
        t.setLevel(Math.max(0, Math.min(4, level)));
        t.setApprovals(0);
        if (pinned != null) t.setPinned(pinned);
        h.getPromotionsOffered().remove(cls.name());
    }
}
