package app.familyos.service.domain.ledger;

import java.util.List;
import java.util.Map;

public enum LedgerState {
    DETECTED,
    AWAITING_DECISION,
    EXECUTED,
    DECLINED,
    SNOOZED,
    SCHEDULED,
    NOTED;

    private static final Map<LedgerState, List<LedgerState>> TRANSITIONS = Map.of(
            DETECTED, List.of(AWAITING_DECISION, EXECUTED, SCHEDULED, NOTED, DECLINED),
            AWAITING_DECISION, List.of(EXECUTED, DECLINED, SNOOZED),
            SNOOZED, List.of(AWAITING_DECISION, EXECUTED, DECLINED),
            SCHEDULED, List.of(AWAITING_DECISION, EXECUTED, DECLINED),
            EXECUTED, List.of(DECLINED),
            DECLINED, List.of(),
            NOTED, List.of()
    );

    public boolean canMoveTo(LedgerState to) {
        return TRANSITIONS.get(this).contains(to);
    }
}
