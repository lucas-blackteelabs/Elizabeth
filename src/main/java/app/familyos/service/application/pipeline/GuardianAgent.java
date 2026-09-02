package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Flag;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.infrastructure.time.Times;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** The guardian never proposes; it checks. Budget, allergen wording, anything a parent would be upset to discover was done without them. */
public final class GuardianAgent {
    private static final String AGENT = "guardian";

    private GuardianAgent() {
    }

    public static AgentOutput check(PipelineContext ctx, Signal signal, AgentOutput combined) {
        Household h = ctx.getHousehold();
        Extracted ex = signal.getExtracted();
        String month = Times.month(ex.getWhen() == null ? ctx.getNow() : ex.getWhen().start());
        Integer budget = PolicyRules.monthlyBudget(h);
        double spent = ctx.monthSpend(month);
        double proposed = combined.getActions().stream().filter(a -> a.getCls() == ActionClass.PAYMENT || a.getCls() == ActionClass.PURCHASE || a.getCls() == ActionClass.ENROLMENT).mapToDouble(a -> a.getAmount() == null ? 0 : a.getAmount()).sum();
        List<String> notes = new ArrayList<>();
        if (proposed > 0 && budget != null) {
            double remaining = budget - spent - proposed;
            String pid = h.policy(PolicyKind.BUDGET).map(p -> p.getId()).orElse(null);
            if (remaining < 0) combined.getFlags().add(new Flag(Flag.Level.BLOCK, pid, "Would exceed the $" + budget + " " + month + " activities budget by $" + (long) -remaining + "."));
            else combined.getFlags().add(new Flag(Flag.Level.INFO, pid, "Leaves $" + (long) remaining + " of the $" + budget + " " + month + " budget."));
            notes.add("Budget check: $" + (long) proposed + " proposed, $" + (long) spent + " already committed in " + month + ".");
        }
        h.policy(PolicyKind.ALLERGEN).ifPresent(p -> {
            if (!ex.getChildIds().contains(p.str("childId", ""))) return;
            for (Action a : combined.getActions()) {
                if (a.getCls() != ActionClass.OUTBOUND_MESSAGE) continue;
                if (!Pattern.compile("allerg", Pattern.CASE_INSENSITIVE).matcher(a.getDetail()).find()) combined.getFlags().add(new Flag(Flag.Level.BLOCK, p.getId(), "Outbound message does not mention the allergy. Not sending."));
                else notes.add("Allergy stated in the outbound message.");
            }
        });
        if (ex.getTone() != null && ex.getTone().hostile()) combined.getFlags().add(Flag.info("Hostile tone detected. You see only the facts; the reply stays a draft until you send it."));
        for (Action a : combined.getActions()) {
            if (a.getCls() != ActionClass.PAYMENT) continue;
            boolean verified = h.getPlaces().stream().anyMatch(pl -> pl.isVerifiedPayee() && pl.getName().equals(a.getPayee()));
            if (!verified) combined.getFlags().add(Flag.info(a.getPayee() + " is not a verified payee yet; payment will wait for your tap."));
        }
        if (!notes.isEmpty()) ctx.trace(signal.getId(), AGENT, "check", String.join(" ", notes));
        return combined;
    }
}
