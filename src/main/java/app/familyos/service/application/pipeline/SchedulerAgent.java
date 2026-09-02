package app.familyos.service.application.pipeline;

import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Policy;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.proposals.Flag;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Requirement;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/** Places the signal on the household calendar, or explains why it cannot go there cleanly. */
public final class SchedulerAgent {
    private static final String AGENT = "scheduler";

    private SchedulerAgent() {
    }

    @Getter
    @Setter
    public static class Plan extends AgentOutput {
        private CalendarEvent candidate;
        private CalendarEvent moveOf;
        private boolean needsTransport;
        private LocalDateTime earliestFeasible;
    }

    public static Plan schedule(PipelineContext ctx, Signal signal) {
        Plan out = new Plan();
        Extracted ex = signal.getExtracted();
        Household h = ctx.getHousehold();
        if (ex.getWhen() == null || signal.getKind() == SignalKind.PURCHASE_NEED || signal.getKind() == SignalKind.FYI) {
            if (signal.getKind() == SignalKind.FYI && ex.getWhen() != null) out.say("Optional: " + ex.getTitle() + " on " + Times.fmtWhen(ex.getWhen().start(), ex.getWhen().end(), ex.getWhen().allDay()) + ". Not added to the calendar.");
            return out;
        }
        List<String> kids = ex.getChildIds();
        boolean recurring = signal.getKind() == SignalKind.REGISTRATION;
        boolean foodAdjacent = signal.getKind() == SignalKind.INVITATION || Pattern.compile("lunch|food|pizza|cake|snack", Pattern.CASE_INSENSITIVE).matcher(signal.getRaw().body()).find();
        out.getFlags().addAll(PolicyRules.forEvent(h, ex, recurring, foodAdjacent));

        if (signal.getKind() == SignalKind.COPARENT_MESSAGE) {
            Optional<Policy> custody = h.policy(PolicyKind.CUSTODY);
            String childId = custody.map(p -> p.str("childId", "")).filter(s -> !s.isBlank()).orElse(kids.isEmpty() ? null : kids.get(0));
            LocalDateTime requested = ex.getWhen().start();
            LocalDateTime standard = custody.map(p -> Times.withTime(requested, p.str("handoverTime", "18:00"))).orElse(null);
            LocalDateTime earliest = requested;
            if (childId != null) {
                for (CalendarEvent e : ctx.getCalendar()) {
                    if (!e.getPersonIds().contains(childId) || !e.getStart().toLocalDate().equals(requested.toLocalDate()) || !e.getEnd().isAfter(requested.minusMinutes(60))) continue;
                    int travel = h.place(e.getPlaceId()).map(p -> p.getTravelMinutesFromHome()).orElse(0) + h.place(ex.getPlaceId()).map(p -> p.getTravelMinutesFromHome()).orElse(0) - 10;
                    LocalDateTime feasible = e.getEnd().plusMinutes(Math.max(travel, 10));
                    if (feasible.isAfter(earliest)) {
                        earliest = feasible;
                        out.say(h.personName(childId) + " has " + e.getTitle() + " until " + Times.fmtTime(e.getEnd()) + " at " + (ctx.placeName(e.getPlaceId()) == null ? "school" : ctx.placeName(e.getPlaceId())) + "; earliest realistic handover is " + Times.fmtTime(feasible) + ".");
                    }
                }
            }
            if (standard != null) out.say("Standing handover is " + Times.fmtTime(standard) + ". Request is " + Times.fmtTime(requested) + ".");
            out.setEarliestFeasible(earliest);
            if (earliest.equals(requested)) out.say(Times.fmtTime(requested) + " works: nothing on " + h.personName(childId) + "'s calendar.");
            out.setCandidate(CalendarEvent.builder().id("ev_" + UUID.randomUUID().toString().substring(0, 8)).householdId(h.getId())
                    .title("Handover: " + h.personName(childId) + " to " + signal.getRaw().from()).personIds(childId == null ? new ArrayList<>() : new ArrayList<>(List.of(childId)))
                    .start(earliest).end(earliest.plusMinutes(15)).placeId(ex.getPlaceId()).source(CalendarEvent.Source.SIGNAL).sourceId(signal.getId())
                    .driverId(h.getPeople().stream().filter(p -> p.getRole() == Role.PARENT).map(p -> p.getId()).findFirst().orElse(null)).build());
            out.setNeedsTransport(true);
            ctx.trace(signal.getId(), AGENT, "negotiate", String.join(" ", out.getRationale()));
            return out;
        }

        if (signal.getKind() == SignalKind.SCHEDULE_CHANGE && ex.getPreviousWhen() != null) {
            Optional<CalendarEvent> existing = ctx.getCalendar().stream()
                    .filter(e -> kids.stream().anyMatch(k -> e.getPersonIds().contains(k)) && e.getStart().equals(ex.getPreviousWhen().start()))
                    .findFirst();
            if (existing.isPresent()) {
                CalendarEvent old = existing.get();
                long duration = java.time.Duration.between(old.getStart(), old.getEnd()).toMinutes();
                LocalDateTime start = ex.getWhen().start();
                LocalDateTime end = start.plusMinutes(duration);
                String placeId = ex.getPlaceId() != null ? ex.getPlaceId() : old.getPlaceId();
                out.setMoveOf(old);
                out.setCandidate(CalendarEvent.builder().id(old.getId()).householdId(h.getId()).title(old.getTitle()).personIds(old.getPersonIds()).start(start).end(end)
                        .placeId(placeId).driverId(old.getDriverId()).source(old.getSource()).sourceId(old.getSourceId()).build());
                out.setNeedsTransport(true);
                out.say("Matched to " + old.getTitle() + " (" + Times.fmtWhen(old.getStart(), old.getEnd(), false) + "). New window " + Times.fmtTime(start) + "–" + Times.fmtTime(end) + ".");
                out.getActions().add(AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, "Move " + old.getTitle() + " to " + Times.fmtTime(start),
                        Times.fmtWhen(start, end, false) + " at " + ctx.placeName(placeId) + ". Both parents' calendars updated.",
                        Map.of("op", "move", "eventId", old.getId(), "start", start.toString(), "end", end.toString())));
                for (CalendarRules.Conflict c : CalendarRules.findConflicts(h, ctx.getCalendar(), start, end, kids, old.getDriverId(), placeId, old.getId())) {
                    out.say("Conflict: " + c.detail());
                    if (!c.driver()) out.getFlags().add(Flag.warn(c.detail()));
                }
                ctx.trace(signal.getId(), AGENT, "move", String.join(" ", out.getRationale()));
                return out;
            }
            out.say("Could not match the old time to anything on the calendar; adding as a new event.");
        }

        LocalDateTime end = ex.getWhen().end() != null ? ex.getWhen().end() : ex.getWhen().allDay() ? ex.getWhen().start().plusDays(1).minusMinutes(1) : ex.getWhen().start().plusMinutes(60);
        boolean schoolRun = signal.getKind() == SignalKind.PERMISSION_REQUEST;
        String title = ex.getTitle().replaceFirst("^[^:]+:\\s*", "");
        CalendarEvent candidate = CalendarEvent.builder().id("ev_" + UUID.randomUUID().toString().substring(0, 8)).householdId(h.getId()).title(title).personIds(new ArrayList<>(kids))
                .start(ex.getWhen().start()).end(end).placeId(ex.getPlaceId()).locationText(ex.getLocationText()).source(CalendarEvent.Source.SIGNAL).sourceId(signal.getId())
                .notes(ex.getItems().isEmpty() ? new ArrayList<>() : new ArrayList<>(List.of("Bring: " + String.join(", ", ex.getItems())))).build();
        out.setCandidate(candidate);
        out.setNeedsTransport(!schoolRun && ex.requires(Requirement.TRANSPORT) && !recurring);
        List<CalendarRules.Conflict> conflicts = CalendarRules.findConflicts(h, ctx.getCalendar(), ex.getWhen().start(), end, kids, null, ex.getPlaceId(), null);
        for (CalendarRules.Conflict c : conflicts) {
            if (c.driver()) continue;
            out.getFlags().add(Flag.warn("Clash: " + c.detail()));
            out.say("Clash: " + c.detail());
        }
        if (conflicts.isEmpty()) out.say("No clashes for " + String.join(" or ", kids.stream().map(h::personName).toList()) + " on " + Times.fmtWhen(ex.getWhen().start(), end, ex.getWhen().allDay()) + ".");
        if (!recurring) {
            out.getActions().add(AgentOutput.action(AGENT, ActionClass.CALENDAR_WRITE, "Add " + candidate.getTitle(),
                    Times.fmtWhen(ex.getWhen().start(), end, ex.getWhen().allDay()) + (ex.getLocationText() != null ? " · " + ex.getLocationText() : ""),
                    Map.of("op", "add", "eventId", candidate.getId())));
        } else {
            out.say("First session " + Times.fmtWhen(ex.getWhen().start(), end, false) + "; not on the calendar until enrolled.");
        }
        ctx.trace(signal.getId(), AGENT, "place", String.join(" ", out.getRationale()));
        return out;
    }
}
