package app.familyos.service.application;

import app.familyos.service.application.households.DemoHousehold;
import app.familyos.service.application.intake.IntakeRules;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.SignalKind;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class IntakeRulesTest {
    private final Household h = DemoHousehold.seed("u1");
    private final List<IntakeRules.Parsed> parsed = DemoHousehold.inbox().stream().map(r -> IntakeRules.parse(r, h, DemoHousehold.NOW)).toList();

    @Test
    void classifiesEveryDemoInputWithoutAModel() {
        assertThat(parsed.stream().map(IntakeRules.Parsed::kind)).containsExactly(
                SignalKind.PERMISSION_REQUEST, SignalKind.SCHEDULE_CHANGE, SignalKind.INVITATION, SignalKind.APPOINTMENT,
                SignalKind.PURCHASE_NEED, SignalKind.COPARENT_MESSAGE, SignalKind.REGISTRATION, SignalKind.FYI);
    }

    @Test
    void excursionMapsYear6ToAvaWithWindowFeeDeadlineAndItems() {
        var ex = parsed.get(0).extracted();
        assertThat(ex.getChildIds()).containsExactly("c_ava");
        assertThat(ex.getWhen().start()).isEqualTo(LocalDateTime.of(2026, 9, 10, 8, 15));
        assertThat(ex.getWhen().end()).isEqualTo(LocalDateTime.of(2026, 9, 10, 15, 0));
        assertThat(ex.getDeadline()).isEqualTo(LocalDateTime.of(2026, 9, 4, 0, 0));
        assertThat(ex.getAmount()).isEqualTo(38.0);
        assertThat(ex.getPlaceId()).isEqualTo("pl_zoo");
        assertThat(ex.getItems()).containsExactly("packed lunch", "hat", "refillable water bottle");
    }

    @Test
    void coachMessageResolvesU8sToLeoAndCapturesTheMove() {
        var ex = parsed.get(1).extracted();
        assertThat(ex.getChildIds()).containsExactly("c_leo");
        assertThat(ex.getWhen().start()).isEqualTo(LocalDateTime.of(2026, 9, 5, 10, 30));
        assertThat(ex.getPreviousWhen().start()).isEqualTo(LocalDateTime.of(2026, 9, 5, 9, 0));
        assertThat(ex.getPlaceId()).isEqualTo("pl_jubilee");
    }

    @Test
    void coparentHostileToneIsStrippedAndFridayFivePmIsAnEventNotADeadline() {
        var ex = parsed.get(5).extracted();
        assertThat(ex.getTone().hostile()).isTrue();
        assertThat(ex.getWhen().start()).isEqualTo(LocalDateTime.of(2026, 9, 4, 17, 0));
        assertThat(ex.getDeadline()).isNull();
        assertThat(ex.getTone().neutralised()).contains("homework folder was not sent").doesNotContainIgnoringCase("typical");
    }

    @Test
    void registrationPicksLeoByAgeRangeAndTheSeasonStart() {
        var ex = parsed.get(6).extracted();
        assertThat(ex.getChildIds()).containsExactly("c_leo");
        assertThat(ex.getWhen().start()).isEqualTo(LocalDateTime.of(2026, 10, 17, 8, 30));
        assertThat(ex.getDeadline()).isEqualTo(LocalDateTime.of(2026, 10, 1, 0, 0));
        assertThat(ex.getAgeMin()).isEqualTo(5);
        assertThat(ex.getOtherDates()).contains(LocalDateTime.of(2026, 12, 12, 0, 0));
    }

    @Test
    void datedGameWithAChildBecomesAnEvent() {
        var p = IntakeRules.parse(new RawMessage(app.familyos.service.domain.signals.Channel.WHATSAPP, "Netball team manager", null,
                "The U12s are through to the grand final, Saturday 12 September 9am at Balmain Netball Courts. Please arrive by 8:30am."), h, DemoHousehold.NOW);
        assertThat(p.kind()).isEqualTo(SignalKind.EVENT);
        assertThat(p.extracted().getChildIds()).containsExactly("c_ava");
        assertThat(p.extracted().getWhen().start()).isEqualTo(LocalDateTime.of(2026, 9, 12, 9, 0));
    }
}
