package app.familyos.service.application.pipeline;

import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.proposals.Flag;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Who drives, and what has to shuffle so everyone gets where they need to be. */
public final class LogisticsAgent {
    private static final String AGENT = "logistics";

    private LogisticsAgent() {
    }

    public static AgentOutput run(PipelineContext ctx, Signal signal, SchedulerAgent.Plan plan) {
        AgentOutput out = new AgentOutput();
        CalendarEvent ev = plan.getCandidate();
        if (ev == null || !plan.isNeedsTransport() || signal.getKind() == SignalKind.COPARENT_MESSAGE) return out;
        Household h = ctx.getHousehold();
        List<String> childIds = ev.getPersonIds();
        String preferred = plan.getMoveOf() != null && plan.getMoveOf().getDriverId() != null ? plan.getMoveOf().getDriverId()
                : h.getStanding().stream().filter(s -> childIds.contains(s.getPersonId())).map(StandingCommitment::getUsualDriverId).filter(d -> d != null).findFirst().orElse(null);
        CalendarRules.DriverPlan dp = CalendarRules.planDriver(h, ctx.getCalendar(), ev.getStart(), ev.getEnd(), ev.getPlaceId(), childIds, preferred, plan.getMoveOf() == null ? null : plan.getMoveOf().getId());
        out.getRationale().addAll(dp.rationale());
        String who = String.join(" & ", childIds.stream().map(h::personName).toList());
        String where = ctx.placeName(ev.getPlaceId()) != null ? ctx.placeName(ev.getPlaceId()) : ev.getLocationText() != null ? ev.getLocationText() : "the event";
        int travel = h.place(ev.getPlaceId()).map(p -> p.getTravelMinutesFromHome()).orElse(15);
        if (dp.driverId() != null) {
            boolean changed = plan.getMoveOf() != null && plan.getMoveOf().getDriverId() != null && !plan.getMoveOf().getDriverId().equals(dp.driverId());
            String title = changed ? h.personName(dp.driverId()) + " drives instead of " + h.personName(plan.getMoveOf().getDriverId()) : h.personName(dp.driverId()) + " drives";
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, title, who + " to " + where + ", leave " + Times.fmtTime(ev.getStart().minusMinutes(travel)) + ".",
                    Map.of("op", "assign_driver", "eventId", ev.getId(), "driverId", dp.driverId())));
            if (changed) {
                String displaced = plan.getMoveOf().getDriverId();
                for (CalendarEvent s : ctx.getCalendar()) {
                    if (!displaced.equals(s.getDriverId()) || !s.getStart().toLocalDate().equals(ev.getStart().toLocalDate()) || s.getId().equals(plan.getMoveOf().getId())) continue;
                    out.say(h.personName(displaced) + " keeps " + s.getTitle() + " (" + Times.fmtTime(s.getStart()) + ").");
                    if (CalendarRules.findConflicts(h, ctx.getCalendar(), s.getStart(), s.getEnd(), List.of(), dp.driverId(), s.getPlaceId(), s.getId()).isEmpty()) {
                        out.getAlternatives().add(new Alternative(
                                "Swap: " + h.personName(dp.driverId()) + " takes " + s.getTitle() + ", " + h.personName(displaced) + " keeps " + ev.getTitle(),
                                h.personName(dp.driverId()) + " drives " + String.join(" & ", s.getPersonIds().stream().map(h::personName).toList()) + " at " + Times.fmtTime(s.getStart()) + ".",
                                List.of(
                                        AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, h.personName(dp.driverId()) + " drives " + s.getTitle(), Times.fmtTime(s.getStart()) + " at " + ctx.placeName(s.getPlaceId()), Map.of("op", "assign_driver", "eventId", s.getId(), "driverId", dp.driverId())),
                                        AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, h.personName(displaced) + " keeps " + ev.getTitle(), Times.fmtTime(ev.getStart()) + " at " + ctx.placeName(ev.getPlaceId()), Map.of("op", "assign_driver", "eventId", ev.getId(), "driverId", displaced))
                                )));
                    }
                }
            }
        } else {
            out.getFlags().add(Flag.warn("Nobody is free to drive without moving something."));
            for (String[] alt : dp.alternatives()) {
                out.getAlternatives().add(new Alternative(alt[1], "Assign " + h.personName(alt[0]) + ".", List.of(AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, h.personName(alt[0]) + " drives", alt[1], Map.of("op", "assign_driver", "eventId", ev.getId(), "driverId", alt[0])))));
            }
            Optional<Person> carer = h.getPeople().stream().filter(p -> p.getRole() == Role.CARER).findFirst();
            if (carer.isEmpty()) {
                carer = h.policy(PolicyKind.CUSTODY).filter(p -> childIds.contains(p.str("childId", ""))).flatMap(p -> h.person(p.str("coparentId", "")));
            }
            carer.ifPresent(c -> out.getAlternatives().add(new Alternative("Ask " + c.getName(), "Draft a message asking " + c.getName() + " to cover the drive.",
                    List.of(AgentOutput.action(AGENT, ActionClass.OUTBOUND_MESSAGE, "Ask " + c.getName() + " to drive", "Could you take " + who + " at " + Times.fmtTime(ev.getStart()) + "?", Map.of("to", c.getName(), "channel", "sms"))))));
        }
        ctx.trace(signal.getId(), AGENT, "drive", String.join(" ", out.getRationale()));
        return out;
    }
}
