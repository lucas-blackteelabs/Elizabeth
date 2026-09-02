package app.familyos.service.application.pipeline;

import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Place;
import app.familyos.service.domain.households.Role;
import app.familyos.service.domain.households.StandingCommitment;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Expanding standing commitments, finding clashes, and choosing who drives. */
public final class CalendarRules {
    public static final int HORIZON_DAYS = 42;

    private CalendarRules() {
    }

    public static String occurrenceId(StandingCommitment s, LocalDate day) {
        return s.getId() + "@" + day;
    }

    /** Concrete occurrences of every standing commitment inside the planning horizon. */
    public static List<CalendarEvent> expandStanding(Household h, LocalDateTime from) {
        List<CalendarEvent> out = new ArrayList<>();
        LocalDate start = from.toLocalDate();
        for (int i = 0; i < HORIZON_DAYS; i++) {
            LocalDate day = start.plusDays(i);
            int dow = Times.weekday(day);
            for (StandingCommitment s : h.getStanding()) {
                if (s.getDay() != dow || !s.inSeason(day.toString())) continue;
                out.add(CalendarEvent.builder()
                        .id(occurrenceId(s, day))
                        .householdId(h.getId())
                        .title(s.getTitle())
                        .personIds(new ArrayList<>(List.of(s.getPersonId())))
                        .start(Times.withTime(day.atStartOfDay(), s.getStart()))
                        .end(Times.withTime(day.atStartOfDay(), s.getEnd()))
                        .placeId(s.getPlaceId())
                        .driverId(s.getUsualDriverId())
                        .source(CalendarEvent.Source.STANDING)
                        .sourceId(s.getId())
                        .build());
            }
        }
        return out;
    }

    public record Conflict(CalendarEvent event, boolean driver, String personId, String detail) {
    }

    static int travelBetween(Household h, String a, String b) {
        if (a == null || b == null || a.equals(b)) return 0;
        Optional<Place> pa = h.place(a);
        Optional<Place> pb = h.place(b);
        if (pa.isPresent() && pb.isPresent() && pa.get().getSuburb().equals(pb.get().getSuburb())) return 5;
        return Math.max(pa.map(Place::getTravelMinutesFromHome).orElse(0), pb.map(Place::getTravelMinutesFromHome).orElse(0));
    }

    public static List<Conflict> findConflicts(Household h, List<CalendarEvent> calendar, LocalDateTime start, LocalDateTime end, List<String> personIds, String driverId, String placeId, String ignoreEventId) {
        List<Conflict> out = new ArrayList<>();
        for (CalendarEvent ev : calendar) {
            if (ev.getId().equals(ignoreEventId)) continue;
            for (String pid : personIds) {
                if (ev.getPersonIds().contains(pid) && ev.overlaps(start, end)) {
                    out.add(new Conflict(ev, false, pid, h.personName(pid) + " already has " + ev.getTitle() + " " + Times.fmtTime(ev.getStart()) + "–" + Times.fmtTime(ev.getEnd()) + "."));
                }
            }
            if (driverId != null && driverId.equals(ev.getDriverId())) {
                int buffer = travelBetween(h, placeId, ev.getPlaceId());
                if (Times.overlaps(start.minusMinutes(buffer), end.plusMinutes(buffer), ev.getStart(), ev.getEnd())) {
                    out.add(new Conflict(ev, true, driverId, h.personName(driverId) + " is driving to " + ev.getTitle() + " " + Times.fmtTime(ev.getStart()) + "–" + Times.fmtTime(ev.getEnd()) + (buffer > 0 ? " (" + buffer + " min apart)" : "") + "."));
                }
            }
        }
        return out;
    }

    public record Free(boolean free, String reason, boolean flexible) {
    }

    public static Free adultFree(Household h, List<CalendarEvent> calendar, Person adult, LocalDateTime start, LocalDateTime end, String placeId, String ignoreEventId) {
        int dow = Times.weekday(start);
        for (Person.AvailabilityBlock block : adult.getUnavailable()) {
            if (block.day() != dow) continue;
            LocalDateTime bs = Times.withTime(start, block.start());
            LocalDateTime be = Times.withTime(start, block.end());
            if (Times.overlaps(start, end, bs, be)) return new Free(false, adult.getName() + " has " + block.label() + " " + block.start() + "–" + block.end(), block.flexible());
        }
        List<Conflict> c = findConflicts(h, calendar, start, end, List.of(), adult.getId(), placeId, ignoreEventId);
        if (!c.isEmpty()) return new Free(false, c.get(0).detail().replaceAll("\\.$", ""), false);
        return new Free(true, null, false);
    }

    public record DriverPlan(String driverId, List<String> rationale, List<String[]> alternatives) {
    }

    public static DriverPlan planDriver(Household h, List<CalendarEvent> calendar, LocalDateTime start, LocalDateTime end, String placeId, List<String> childIds, String preferredDriverId, String ignoreEventId) {
        int travel = h.place(placeId).map(Place::getTravelMinutesFromHome).orElse(15);
        LocalDateTime depart = start.minusMinutes(travel);
        LocalDateTime back = end.plusMinutes(travel);
        List<String> rationale = new ArrayList<>();
        List<String[]> alternatives = new ArrayList<>();
        List<Person> adults = new ArrayList<>(h.getPeople().stream().filter(p -> p.getRole() == Role.PARENT && p.isCanDrive()).toList());
        if (preferredDriverId != null) adults.sort((a, b) -> a.getId().equals(preferredDriverId) ? -1 : b.getId().equals(preferredDriverId) ? 1 : 0);
        String chosen = null;
        for (Person a : adults) {
            Free f = adultFree(h, calendar, a, depart, back, placeId, ignoreEventId);
            if (f.free() && chosen == null) {
                chosen = a.getId();
                rationale.add(a.getName() + " is free " + Times.fmtTime(depart) + "–" + Times.fmtTime(back) + " (door to door, " + travel + " min each way).");
            } else if (f.free()) {
                alternatives.add(new String[]{a.getId(), a.getName() + " is also free."});
            } else {
                rationale.add(f.reason() + (f.flexible() ? " (flexible)" : "") + ".");
                if (f.flexible()) alternatives.add(new String[]{a.getId(), a.getName() + " could move " + (f.reason().contains(" has ") ? f.reason().substring(f.reason().indexOf(" has ") + 5) : "their block") + "."});
            }
        }
        if (chosen == null) rationale.add("No parent is free without moving something.");
        return new DriverPlan(chosen, rationale, alternatives);
    }
}
