package app.familyos.service.application.pipeline;

import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.OutboundMessage;
import app.familyos.service.domain.calendar.Reminder;
import app.familyos.service.domain.calendar.SpendEntry;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.trace.TraceStep;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Everything one pipeline run reads and everything it changes, so the agents
 * stay pure and the orchestrator does all the persisting.
 */
@Getter
public class PipelineContext {
    private final Household household;
    private final LocalDateTime now;
    private final List<CalendarEvent> calendar;
    private final ChoreBoard board;
    private final List<SpendEntry> spend;
    private final List<Reminder> newReminders = new ArrayList<>();
    private final List<OutboundMessage> newMessages = new ArrayList<>();
    private final List<SpendEntry> newSpend = new ArrayList<>();
    private final List<TraceStep> trace = new ArrayList<>();
    private final Set<String> touchedEventIds = new LinkedHashSet<>();
    private boolean householdChanged;
    private boolean boardChanged;

    public PipelineContext(Household household, LocalDateTime now, List<CalendarEvent> calendar, ChoreBoard board, List<SpendEntry> spend) {
        this.household = household;
        this.now = now;
        this.calendar = new ArrayList<>(calendar);
        this.board = board;
        this.spend = new ArrayList<>(spend);
    }

    public void trace(String signalId, String agent, String step, String detail) {
        trace.add(TraceStep.builder().householdId(household.getId()).at(now).signalId(signalId).agent(agent).step(step).detail(detail).build());
    }

    public double monthSpend(String month) {
        double committed = spend.stream().filter(s -> month.equals(s.getMonth())).mapToDouble(SpendEntry::getAmount).sum();
        double pending = newSpend.stream().filter(s -> month.equals(s.getMonth())).mapToDouble(SpendEntry::getAmount).sum();
        return committed + pending;
    }

    public void touch(CalendarEvent ev) {
        if (!calendar.contains(ev)) calendar.add(ev);
        touchedEventIds.add(ev.getId());
    }

    public void markHouseholdChanged() {
        householdChanged = true;
    }

    public void markBoardChanged() {
        boardChanged = true;
    }

    public String personName(String id) {
        return household.personName(id);
    }

    public String placeName(String id) {
        return household.placeName(id);
    }
}
