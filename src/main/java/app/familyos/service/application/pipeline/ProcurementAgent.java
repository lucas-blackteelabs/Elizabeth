package app.familyos.service.application.pipeline;

import app.familyos.service.application.intake.IntakeRules;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Closes the loop on money and stuff: fees, gifts, gear, and the things that must be in the bag. */
public final class ProcurementAgent {
    private static final String AGENT = "procurement";

    private ProcurementAgent() {
    }

    public static AgentOutput run(PipelineContext ctx, Signal signal) {
        AgentOutput out = new AgentOutput();
        Extracted ex = signal.getExtracted();
        Household h = ctx.getHousehold();
        List<Person> kids = ex.getChildIds().stream().map(h::person).flatMap(java.util.Optional::stream).toList();
        List<String> parentIds = h.parents().stream().map(Person::getId).toList();

        if (signal.getKind() == SignalKind.PERMISSION_REQUEST && ex.getAmount() != null) {
            var a = AgentOutput.action(AGENT, ActionClass.PAYMENT, "Pay $" + IntakeRules.fmt(ex.getAmount()) + " to " + ex.getPayee(), "Excursion fee via the school portal.", Map.of("amount", ex.getAmount(), "payee", String.valueOf(ex.getPayee())));
            a.setAmount(ex.getAmount());
            a.setPayee(ex.getPayee());
            out.getActions().add(a);
        }

        if (!ex.getItems().isEmpty() && ex.getWhen() != null) {
            Person allergic = kids.stream().filter(k -> !k.getAllergies().isEmpty()).findFirst().orElse(null);
            List<String> items = ex.getItems().stream().map(i -> allergic != null && Pattern.compile("lunch|snack", Pattern.CASE_INSENSITIVE).matcher(i).find() ? i + " (nut-free for " + allergic.getName() + ")" : i).toList();
            LocalDateTime at = Times.withTime(ex.getWhen().start().minusDays(1), "19:30");
            Map<String, Object> p = new HashMap<>();
            p.put("at", at.toString());
            p.put("text", String.join(" & ", kids.stream().map(Person::getName).toList()) + ": pack " + String.join(", ", items));
            p.put("personIds", parentIds);
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.REMINDER, "Pack: " + String.join(", ", items), "Reminder " + Times.fmtDay(at) + " 7:30pm.", p));
            out.say("Packing reminder set for the night before.");
        }

        if (signal.getKind() == SignalKind.INVITATION) {
            int cap = PolicyRules.giftCap(h);
            Person kid = kids.isEmpty() ? null : kids.get(0);
            String idea = h.getGiftIdeas().stream().filter(g -> kid != null && kid.getInterests().stream().anyMatch(i -> i.toLowerCase().contains(g.toLowerCase()))).findFirst()
                    .orElse(h.getGiftIdeas().isEmpty() ? "a book" : h.getGiftIdeas().get(0));
            Matcher host = Pattern.compile("\\b([A-Z][a-z]+) is turning (\\d+)").matcher(signal.getRaw().body());
            String hostName = host.find() ? host.group(1) : "the birthday child";
            Integer age = host.reset().find() ? Integer.parseInt(host.group(2)) : kid == null ? null : kid.getAge();
            LocalDateTime deliver = (ex.getWhen() == null ? ctx.getNow() : ex.getWhen().start()).minusDays(2);
            var a = AgentOutput.action(AGENT, ActionClass.PURCHASE, "Gift under $" + cap + ": " + idea + " for " + hostName + (age != null ? " (turning " + age + ")" : ""),
                    "Matched to what " + (kid == null ? "your child" : kid.getName()) + " likes; delivered by " + Times.fmtDay(deliver) + ".", Map.of("items", List.of(idea), "estimate", cap));
            a.setAmount((double) cap);
            out.getActions().add(a);
            out.say("Gift budget policy is $" + cap + ". " + idea + " suits " + (age != null ? (List.of(8, 11, 18).contains(age) ? "an " : "a ") + age + "-year-old" : "the age") + " and is on your usual list.");
        }

        if (signal.getKind() == SignalKind.PURCHASE_NEED) {
            Matcher pm = Pattern.compile("([A-Za-z ]+?)\\s+\\$(\\d+)").matcher(signal.getRaw().body());
            Map<String, Integer> prices = new HashMap<>();
            while (pm.find()) prices.put(pm.group(1).trim().toLowerCase(), Integer.parseInt(pm.group(2)));
            boolean sizeUp = Pattern.compile("size up|run small|outgrow", Pattern.CASE_INSENSITIVE).matcher(signal.getRaw().body()).find();
            int total = 0;
            List<String> lines = new ArrayList<>();
            for (Person kid : kids) {
                Person.SizeRecord rec = kid.getSizes().get("school uniform");
                if (rec == null) continue;
                long months = ChronoUnit.MONTHS.between(LocalDate.parse(rec.recordedOn()), ctx.getNow().toLocalDate());
                int next = Integer.parseInt(rec.size()) + (months >= 6 || sizeUp ? 2 : 0);
                if (next == Integer.parseInt(rec.size())) continue;
                int est = prices.entrySet().stream().filter(e -> e.getKey().matches(".*(polo|shorts?).*")).mapToInt(e -> e.getValue() * 2).sum();
                if (est == 0) est = 100;
                total += est;
                lines.add(kid.getName() + ": size " + next + " (was " + rec.size() + " in " + rec.recordedOn().substring(0, 7) + ", " + months + " months ago" + (sizeUp ? ", shop says sizes run small" : "") + ") · 2 polos + 2 shorts ≈ $" + est);
            }
            if (!lines.isEmpty()) {
                var a = AgentOutput.action(AGENT, ActionClass.PURCHASE, "Order summer uniforms (≈ $" + total + ")", String.join("\n", lines), Map.of("items", lines, "estimate", total));
                a.setAmount((double) total);
                a.setPayee(ex.getPayee());
                out.getActions().add(a);
                if (ex.getDeadline() != null) {
                    LocalDateTime at = Times.withTime(ex.getDeadline().minusDays(2), "19:30");
                    out.getActions().add(AgentOutput.action(AGENT, ActionClass.REMINDER, "Uniform order closes " + Times.fmtDay(ex.getDeadline()), "Nudge two days before the cut-off if not yet ordered.",
                            Map.of("at", at.toString(), "text", "Uniform orders close in two days", "personIds", parentIds)));
                }
                out.getRationale().addAll(lines);
            }
        }
        if (!out.getActions().isEmpty()) ctx.trace(signal.getId(), AGENT, "supply", out.getRationale().isEmpty() ? String.join("; ", out.getActions().stream().map(a -> a.getTitle()).toList()) : String.join(" ", out.getRationale()));
        return out;
    }
}
