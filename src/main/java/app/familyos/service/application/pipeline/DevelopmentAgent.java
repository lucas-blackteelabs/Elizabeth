package app.familyos.service.application.pipeline;

import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.ActivityCategory;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/** Connects logistics to what the parents said they want for each child. */
public final class DevelopmentAgent {
    private static final String AGENT = "development";

    private DevelopmentAgent() {
    }

    public static AgentOutput run(PipelineContext ctx, Signal signal) {
        AgentOutput out = new AgentOutput();
        Extracted ex = signal.getExtracted();
        Household h = ctx.getHousehold();
        if (signal.getKind() != SignalKind.REGISTRATION || ex.getWhen() == null) return out;
        String seasonFrom = ex.getWhen().start().toLocalDate().toString();
        String seasonTo = ex.getOtherDates().stream().map(d -> d.toLocalDate().toString()).filter(d -> d.compareTo(seasonFrom) > 0).sorted().reduce((a, b) -> b).orElse(ex.getWhen().start().toLocalDate().plusMonths(3).toString());
        String program = signal.getRaw().subject() == null ? "program" : signal.getRaw().subject();
        ActivityCategory category = ex.getInterestTags().stream().anyMatch(t -> List.of("art", "music", "dance", "drama").contains(t)) ? ActivityCategory.CREATIVE : ActivityCategory.SPORT;
        for (String cid : ex.getChildIds()) {
            Person kid = h.person(cid).orElse(null);
            if (kid == null) continue;
            List<String> interest = ex.getInterestTags().stream().filter(t -> kid.getInterests().stream().anyMatch(i -> i.toLowerCase().contains(t))).toList();
            boolean ageOk = ex.getAgeMin() == null || (kid.getAge() != null && kid.getAge() >= ex.getAgeMin() && kid.getAge() <= ex.getAgeMax());
            out.getFlags().addAll(PolicyRules.forLoad(h, cid, category, seasonFrom, seasonTo));
            List<String> values = h.getValues().stream().filter(v -> (category == ActivityCategory.SPORT && Pattern.compile("resilience|team|outdoor").matcher(v).find()) || (category == ActivityCategory.CREATIVE && v.contains("creativ"))).toList();
            List<String> r = new ArrayList<>();
            r.add(interest.isEmpty() ? kid.getName() + " has not shown interest in this yet." : kid.getName() + " lists " + String.join(", ", interest) + " as an interest.");
            r.add(ageOk ? "Age fits" + (ex.getAgeMin() != null ? " (" + ex.getAgeMin() + "–" + ex.getAgeMax() + ")" : "") + "." : "Age is outside the program range.");
            if (!values.isEmpty()) r.add("Supports what you said matters: " + String.join(", ", values) + ".");
            String driver = h.getStanding().stream().filter(s -> s.getPersonId().equals(cid)).map(StandingCommitment::getUsualDriverId).filter(d -> d != null).findFirst().orElse(null);
            List<CalendarRules.Conflict> conflicts = CalendarRules.findConflicts(h, ctx.getCalendar(), ex.getWhen().start(), ex.getWhen().end() == null ? ex.getWhen().start() : ex.getWhen().end(), List.of(cid), driver, ex.getPlaceId(), null);
            r.add(conflicts.isEmpty() ? "First session " + Times.fmtDay(ex.getWhen().start()) + " " + Times.fmtTime(ex.getWhen().start()) + " is clear, including the drive." : "Clashes on the first session: " + String.join(" ", conflicts.stream().map(CalendarRules.Conflict::detail).toList()));
            out.getRationale().addAll(r);
            if (ageOk) {
                Map<String, Object> p = new HashMap<>();
                p.put("childId", cid);
                p.put("title", ex.getInterestTags().isEmpty() ? program : Character.toUpperCase(ex.getInterestTags().get(0).charAt(0)) + ex.getInterestTags().get(0).substring(1));
                p.put("category", category.name());
                p.put("day", Times.weekday(ex.getWhen().start()));
                p.put("start", ex.getWhen().start().toLocalTime().toString());
                p.put("end", (ex.getWhen().end() == null ? ex.getWhen().start() : ex.getWhen().end()).toLocalTime().toString());
                p.put("placeId", ex.getPlaceId());
                p.put("seasonFrom", seasonFrom);
                p.put("seasonTo", seasonTo);
                if (ex.getAmount() != null) p.put("cost", ex.getAmount());
                String cleaned = program.replaceAll("(?i)registrations? now open", "").trim();
                var a = AgentOutput.action(AGENT, ActionClass.ENROLMENT, "Enrol " + kid.getName() + " in " + (cleaned.isEmpty() ? "the program" : cleaned) + (ex.getAmount() != null ? " ($" + app.familyos.service.application.intake.IntakeRules.fmt(ex.getAmount()) + ")" : ""), String.join(" ", r), p);
                a.setAmount(ex.getAmount());
                a.setPayee(ex.getPayee());
                out.getActions().add(a);
            }
        }
        out.getAlternatives().add(new Alternative("Skip this season", "Keep Saturday mornings open; revisit in autumn.", List.of()));
        ctx.trace(signal.getId(), AGENT, "fit", String.join(" ", out.getRationale()));
        return out;
    }
}
