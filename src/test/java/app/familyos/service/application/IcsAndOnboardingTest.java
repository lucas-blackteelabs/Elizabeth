package app.familyos.service.application;

import app.familyos.service.application.agents.completion.HouseholdDraftCompletion;
import app.familyos.service.application.households.DemoHousehold;
import app.familyos.service.application.households.OnboardingRules;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.PolicyKind;
import app.familyos.service.infrastructure.ics.IcsParser;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class IcsAndOnboardingTest {
    private static final String ICS = """
            BEGIN:VCALENDAR
            BEGIN:VEVENT
            UID:train-1
            SUMMARY:U12 Netball training
            LOCATION:Balmain Netball Courts
            DTSTART;TZID=Australia/Sydney:20260902T163000
            DTEND;TZID=Australia/Sydney:20260902T173000
            RRULE:FREQ=WEEKLY;BYDAY=WE;UNTIL=20260930T000000
            END:VEVENT
            BEGIN:VEVENT
            UID:carnival
            SUMMARY:Ava - Swimming carnival
            DTSTART;VALUE=DATE:20260918
            DTEND;VALUE=DATE:20260919
            DESCRIPTION:Bring togs\\, towel and sunscreen
            END:VEVENT
            END:VCALENDAR
            """;

    @Test
    void icsParsesAndExpandsWeeklyRecurrence() {
        List<IcsParser.IcsEvent> events = IcsParser.parse(ICS);
        assertThat(events).hasSize(2);
        List<IcsParser.IcsEvent> expanded = IcsParser.expand(events, DemoHousehold.NOW, 60);
        assertThat(expanded.stream().filter(e -> e.summary().contains("Netball"))).hasSize(5);
        assertThat(expanded.stream().filter(e -> e.summary().contains("carnival")).findFirst().orElseThrow().allDay()).isTrue();
    }

    @Test
    void onboardingRulesBuildAUsableHouseholdFromPlainWords() {
        HouseholdDraftCompletion d = OnboardingRules.draft(DemoHousehold.SAMPLE_INTRO);
        assertThat(d.children().stream().map(HouseholdDraftCompletion.Child::name)).containsExactly("Ava", "Leo", "Maya");
        assertThat(d.adults().stream().map(HouseholdDraftCompletion.Adult::role)).containsExactly("parent", "parent", "coparent");
        assertThat(d.children().get(1).allergies()).containsExactly("nuts");
        assertThat(d.children().get(0).school()).isEqualTo("Leichhardt Public School");
        assertThat(d.homeSuburb()).isEqualTo("Leichhardt");
        Household h = OnboardingRules.toHousehold(d, "u1");
        assertThat(h.children()).hasSize(3);
        assertThat(h.getPolicies().stream().map(p -> p.getKind())).contains(PolicyKind.ALLERGEN, PolicyKind.CUSTODY, PolicyKind.EVENING_CUTOFF);
    }
}
