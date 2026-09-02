package app.familyos.service.application.brief;

import app.familyos.service.domain.ledger.LedgerState;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.proposals.Disposition;
import app.familyos.service.domain.proposals.Flag;
import app.familyos.service.domain.signals.SignalKind;

import java.time.LocalDateTime;
import java.util.List;

/** One notification a day. Everything else is a tap away. */
public record BriefDto(LocalDateTime generatedAt, String headline, Compression compression, List<Item> decide, List<Item> done, List<Item> later, List<Item> fyi) {
    public record Compression(int signals, int decisions, int automated, int deferred, int fyi) {
    }

    public record ActionView(String id, String cls, String title, String detail, Disposition disposition, Double amount) {
    }

    public record Item(String ledgerId, String signalId, String title, String summary, String narrative, SignalKind kind, LedgerState state, List<String> children, String dueLabel,
                       List<ActionView> actions, List<Alternative> alternatives, List<Flag> flags, List<String> why, String originalMessage) {
    }

    public static ActionView view(Action a, Disposition d) {
        return new ActionView(a.getId(), a.getCls().name(), a.getTitle(), a.getDetail(), d, a.getAmount());
    }
}
