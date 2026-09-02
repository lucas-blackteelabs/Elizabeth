package app.familyos.service.api.v1.calendar;

import app.familyos.service.application.calendar.CalendarService;
import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.Reminder;
import app.familyos.service.domain.households.Household;
import app.familyos.service.infrastructure.time.Times;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/v1/calendar")
@RequiredArgsConstructor
@Tag(name = "Calendar")
public class CalendarController {
    private final CalendarService calendarService;
    private final HouseholdService householdService;
    private final UserService userService;

    public record IcsRequest(@NotBlank String url, String label, String childId) {
    }

    private Household me() {
        return householdService.requireForUser(userService.getAuthenticatedUserId());
    }

    @Operation(summary = "Events in a window (defaults to the next 14 days)")
    @GetMapping
    public ResponseEntity<List<CalendarEvent>> events(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        Household h = me();
        calendarService.materialiseStanding(h);
        LocalDateTime now = Times.now(h);
        LocalDateTime f = from == null ? now.toLocalDate().atStartOfDay() : LocalDateTime.parse(from);
        LocalDateTime t = to == null ? f.plusDays(14) : LocalDateTime.parse(to);
        return ResponseEntity.ok(calendarService.range(h.getId(), f, t));
    }

    @GetMapping("/reminders")
    public ResponseEntity<List<Reminder>> reminders() {
        return ResponseEntity.ok(calendarService.reminders(me().getId()));
    }

    @Operation(summary = "Subscribe to any iCal link (school, club, Google, Outlook, webcal)")
    @PostMapping("/ics")
    public ResponseEntity<CalendarService.IcsImport> ics(@RequestBody IcsRequest request) {
        if (!request.url().matches("(?i)^(https?|webcal)://.*")) throw new IllegalArgumentException("That does not look like a calendar link. It usually starts with https:// or webcal://.");
        String label = request.label() == null || request.label().isBlank() ? request.url().replaceFirst("(?i)^(https?|webcal)://", "").split("/")[0].replaceFirst("^www\\.", "") : request.label();
        return ResponseEntity.ok(calendarService.importIcs(me(), request.url(), label, request.childId()));
    }
}
