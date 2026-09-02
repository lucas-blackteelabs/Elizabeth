package app.familyos.service.domain.ledger;

import app.familyos.service.domain.proposals.Disposition;
import app.familyos.service.domain.proposals.Urgency;
import app.familyos.service.domain.signals.SignalKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Every obligation the family has to the outside world, with an append-only history of who did what. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "ledger_entries")
public class LedgerEntry {
    @Id
    private String id;
    @Indexed
    private String householdId;
    private String signalId;
    private String proposalId;
    private String title;
    @Builder.Default
    private List<String> childIds = new ArrayList<>();
    private SignalKind kind;
    private LedgerState state;
    private Urgency urgency;
    private LocalDateTime dueAt;
    @Builder.Default
    private List<ActionDisposition> dispositions = new ArrayList<>();
    @Builder.Default
    private List<LedgerEvent> history = new ArrayList<>();

    public record ActionDisposition(String actionId, Disposition disposition) {
    }

    public record LedgerEvent(LocalDateTime at, LedgerState state, String by, String note) {
    }

    public void transition(LocalDateTime at, LedgerState to, String by, String note) {
        if (!state.canMoveTo(to)) {
            throw new IllegalStateException("Cannot move ledger entry " + id + " from " + state + " to " + to);
        }
        state = to;
        history.add(new LedgerEvent(at, to, by, note));
    }

    public Optional<Disposition> dispositionOf(String actionId) {
        return dispositions.stream().filter(d -> d.actionId().equals(actionId)).map(ActionDisposition::disposition).findFirst();
    }

    public void setDisposition(String actionId, Disposition d) {
        dispositions.removeIf(x -> x.actionId().equals(actionId));
        dispositions.add(new ActionDisposition(actionId, d));
    }
}
