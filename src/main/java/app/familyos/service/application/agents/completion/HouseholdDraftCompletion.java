package app.familyos.service.application.agents.completion;

import java.util.List;

public record HouseholdDraftCompletion(
        String familyName,
        String homeSuburb,
        List<Adult> adults,
        List<Child> children,
        List<Activity> activities,
        List<PlaceDraft> places,
        List<String> values,
        List<String> notes
) {
    public record Adult(String name, String role, String workPattern, Boolean drives) {
    }

    public record Child(String name, Integer age, String yearLevel, String school, List<String> allergies, List<String> interests) {
    }

    public record Activity(String childName, String title, String day, String start, String end, String place) {
    }

    public record PlaceDraft(String name, String suburb, Integer travelMinutesFromHome) {
    }
}
