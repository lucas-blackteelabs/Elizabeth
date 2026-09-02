package app.familyos.service.application.pipeline;

import app.familyos.service.domain.proposals.Urgency;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.infrastructure.time.Times;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** How loudly a signal should reach a parent, and by when it must be resolved. */
public final class Triage {
    private Triage() {
    }

    public record Result(Urgency urgency, LocalDateTime dueAt, List<String> reasons) {
    }

    public static Result triage(Signal signal, LocalDateTime now) {
        Extracted ex = signal.getExtracted();
        List<String> reasons = new ArrayList<>();
        if (signal.getKind() == SignalKind.FYI) return new Result(Urgency.FYI, null, List.of("Nothing is asked of you."));
        LocalDateTime dueAt = ex.getDeadline() != null ? ex.getDeadline() : ex.getWhen() != null ? ex.getWhen().start() : null;
        Long daysToDue = dueAt == null ? null : Times.daysBetween(now, dueAt);
        Long daysToEvent = ex.getWhen() == null ? null : Times.daysBetween(now, ex.getWhen().start());
        if (ex.getDeadline() != null) reasons.add("Deadline in " + daysToDue + " day" + (daysToDue == 1 ? "" : "s") + ".");
        if (ex.getWhen() != null) reasons.add("Happens in " + daysToEvent + " day" + (daysToEvent == 1 ? "" : "s") + ".");
        if (ex.getTone() != null && ex.getTone().hostile()) reasons.add("Tone flagged; handled through the neutral channel.");
        Urgency urgency;
        if (daysToDue != null && daysToDue <= 3) urgency = Urgency.NOW;
        else if (signal.getKind() == SignalKind.SCHEDULE_CHANGE && daysToEvent != null && daysToEvent <= 7) urgency = Urgency.NOW;
        else if (daysToDue != null && daysToDue <= 10) urgency = Urgency.THIS_WEEK;
        else if (daysToEvent != null && daysToEvent <= 10) urgency = Urgency.THIS_WEEK;
        else urgency = Urgency.LATER;
        if (ex.getWhen() == null && ex.getDeadline() == null) {
            urgency = signal.getKind() == SignalKind.COPARENT_MESSAGE ? Urgency.NOW : Urgency.THIS_WEEK;
            reasons.add("Undated; surfacing so it is not lost.");
        }
        return new Result(urgency, dueAt, reasons);
    }
}
