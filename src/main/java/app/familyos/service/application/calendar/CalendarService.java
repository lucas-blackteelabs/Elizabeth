package app.familyos.service.application.calendar;

import app.familyos.service.application.pipeline.CalendarRules;
import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.CalendarEventRepository;
import app.familyos.service.domain.calendar.Reminder;
import app.familyos.service.domain.calendar.ReminderRepository;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.HouseholdRepository;
import app.familyos.service.domain.households.IcsFeed;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.households.Place;
import app.familyos.service.infrastructure.ics.IcsParser;
import app.familyos.service.infrastructure.time.Times;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarEventRepository calendarEventRepository;
    private final ReminderRepository reminderRepository;
    private final HouseholdRepository householdRepository;
    private final IcsParser icsParser;

    /** Standing commitments become concrete events for the planning horizon. Idempotent. */
    public void materialiseStanding(Household h) {
        LocalDateTime now = Times.now(h);
        List<CalendarEvent> wanted = CalendarRules.expandStanding(h, now);
        Set<String> existing = calendarEventRepository.findAllByHouseholdIdAndStartBetweenOrderByStart(h.getId(), now.minusDays(1), now.plusDays(CalendarRules.HORIZON_DAYS + 1))
                .stream().map(CalendarEvent::getId).collect(Collectors.toSet());
        List<CalendarEvent> missing = wanted.stream().filter(e -> !existing.contains(e.getId())).toList();
        if (!missing.isEmpty()) calendarEventRepository.saveAll(missing);
    }

    public List<CalendarEvent> horizon(Household h) {
        LocalDateTime now = Times.now(h);
        return calendarEventRepository.findAllByHouseholdIdAndStartBetweenOrderByStart(h.getId(), now.minusDays(1), now.plusDays(CalendarRules.HORIZON_DAYS + 1));
    }

    public List<CalendarEvent> range(String householdId, LocalDateTime from, LocalDateTime to) {
        return calendarEventRepository.findAllByHouseholdIdAndStartBetweenOrderByStart(householdId, from, to);
    }

    public List<Reminder> reminders(String householdId) {
        return reminderRepository.findAllByHouseholdIdOrderByAt(householdId);
    }

    public record IcsImport(int added, int total) {
    }

    public IcsImport importIcs(Household h, String url, String label, String childId) {
        String text = icsParser.fetch(url);
        List<IcsParser.IcsEvent> expanded = IcsParser.expand(IcsParser.parse(text), Times.now(h), 60);
        List<Person> kids = h.children();
        Set<String> existing = calendarEventRepository.findAllByHouseholdId(h.getId()).stream().map(CalendarEvent::getId).collect(Collectors.toSet());
        List<CalendarEvent> toSave = new ArrayList<>();
        for (IcsParser.IcsEvent ev : expanded) {
            String id = "ics:" + label + ":" + ev.uid();
            if (existing.contains(id)) continue;
            List<String> named = kids.stream().filter(k -> Pattern.compile("\\b" + Pattern.quote(k.getName()) + "\\b", Pattern.CASE_INSENSITIVE).matcher(ev.summary()).find()).map(Person::getId).toList();
            List<String> personIds = !named.isEmpty() ? named : childId != null ? List.of(childId) : List.of();
            Optional<Place> place = ev.location() == null ? Optional.empty() : h.getPlaces().stream().filter(p -> ev.location().toLowerCase().contains(p.getName().toLowerCase()) || p.getAliases().stream().anyMatch(a -> ev.location().toLowerCase().contains(a.toLowerCase()))).findFirst();
            toSave.add(CalendarEvent.builder().id(id).householdId(h.getId()).title(ev.summary()).personIds(new ArrayList<>(personIds)).start(ev.start()).end(ev.end())
                    .placeId(place.map(Place::getId).orElse(null)).locationText(ev.location()).source(CalendarEvent.Source.ICS).sourceId(label)
                    .notes(ev.description() == null ? new ArrayList<>() : new ArrayList<>(List.of(ev.description().substring(0, Math.min(200, ev.description().length()))))).build());
        }
        if (!toSave.isEmpty()) calendarEventRepository.saveAll(toSave);
        h.getIcsFeeds().removeIf(f -> f.url().equals(url));
        h.getIcsFeeds().add(new IcsFeed(url, label, childId, Times.now(h), expanded.size()));
        householdRepository.save(h);
        return new IcsImport(toSave.size(), expanded.size());
    }
}
