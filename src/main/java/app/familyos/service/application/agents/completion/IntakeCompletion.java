package app.familyos.service.application.agents.completion;

import java.util.List;

/** Structured output of the intake extractor agent. Local ISO datetimes, YYYY-MM-DDTHH:mm. */
public record IntakeCompletion(
        String kind,
        String title,
        List<String> childNames,
        Window when,
        Window previousWhen,
        String deadline,
        String location,
        Double amount,
        List<String> items,
        List<String> requires,
        String summary,
        Boolean hostile,
        List<String> facts
) {
    public record Window(String start, String end, Boolean allDay) {
    }
}
