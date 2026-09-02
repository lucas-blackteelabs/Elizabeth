package app.familyos.service.application.brief;

import app.familyos.service.application.agents.BriefScriptWriter;
import app.familyos.service.application.chores.ChoreService;
import app.familyos.service.application.pipeline.Narrator;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.ledger.LedgerEntry;
import app.familyos.service.domain.ledger.LedgerEntryRepository;
import app.familyos.service.domain.ledger.LedgerState;
import app.familyos.service.domain.proposals.Disposition;
import app.familyos.service.domain.proposals.Proposal;
import app.familyos.service.domain.proposals.ProposalRepository;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.domain.signals.SignalRepository;
import app.familyos.service.infrastructure.time.Times;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BriefService {
    private final LedgerEntryRepository ledgerEntryRepository;
    private final ProposalRepository proposalRepository;
    private final SignalRepository signalRepository;
    private final ChoreService choreService;
    private final BriefScriptWriter scriptWriter;

    public BriefDto compose(Household h) {
        LocalDateTime now = Times.now(h);
        Map<String, Proposal> proposals = proposalRepository.findAllByHouseholdId(h.getId()).stream().collect(Collectors.toMap(Proposal::getId, Function.identity()));
        Map<String, Signal> signals = signalRepository.findAllByHouseholdIdOrderByReceivedAtDesc(h.getId()).stream().collect(Collectors.toMap(Signal::getId, Function.identity()));
        List<LedgerEntry> entries = ledgerEntryRepository.findAllByHouseholdId(h.getId());
        List<BriefDto.Item> items = entries.stream().filter(e -> proposals.containsKey(e.getProposalId())).map(e -> toItem(h, now, e, proposals.get(e.getProposalId()), signals.get(e.getSignalId()))).toList();
        Comparator<BriefDto.Item> byDue = Comparator.comparing(i -> entries.stream().filter(e -> e.getId().equals(i.ledgerId())).findFirst().map(e -> e.getDueAt() == null ? "9999" : e.getDueAt().toString()).orElse("9999"));
        List<BriefDto.Item> decide = items.stream().filter(i -> i.state() == LedgerState.AWAITING_DECISION).sorted(byDue).toList();
        List<BriefDto.Item> done = items.stream().filter(i -> i.state() == LedgerState.EXECUTED).toList();
        List<BriefDto.Item> later = items.stream().filter(i -> i.state() == LedgerState.SCHEDULED || i.state() == LedgerState.SNOOZED).sorted(byDue).toList();
        List<BriefDto.Item> fyi = items.stream().filter(i -> i.state() == LedgerState.NOTED || i.state() == LedgerState.DECLINED).toList();
        int automated = entries.stream().mapToInt(e -> (int) e.getDispositions().stream().filter(d -> d.disposition() == Disposition.EXECUTED).count()).sum();
        return new BriefDto(now, Narrator.headline(decide.size(), automated, later.size()), new BriefDto.Compression(signals.size(), decide.size(), automated, later.size(), fyi.size()), decide, done, later, fyi);
    }

    private BriefDto.Item toItem(Household h, LocalDateTime now, LedgerEntry e, Proposal p, Signal s) {
        Long due = e.getDueAt() == null ? null : Times.daysBetween(now, e.getDueAt());
        String dueLabel = e.getDueAt() == null ? null : due == 0 ? "today" : due == 1 ? "tomorrow" : due < 0 ? "overdue" : "by " + Times.fmtDay(e.getDueAt());
        List<BriefDto.ActionView> actions = p.getActions().stream().map(a -> BriefDto.view(a, e.dispositionOf(a.getId()).orElse(Disposition.SUGGESTED))).toList();
        String narrative = Narrator.narrate(p.getActions(), id -> e.dispositionOf(id).orElse(Disposition.SUGGESTED), p.getSummary());
        List<String> why = new ArrayList<>(p.getRationale());
        return new BriefDto.Item(e.getId(), e.getSignalId(), e.getTitle(), p.getSummary(), narrative, e.getKind(), e.getState(), e.getChildIds().stream().map(h::personName).toList(), dueLabel,
                actions, p.getAlternatives(), p.getFlags(), why, s != null && s.getKind() == SignalKind.COPARENT_MESSAGE ? s.getRaw().body() : null);
    }

    public record Script(String script, String source) {
    }

    public Script script(Household h) {
        BriefDto brief = compose(h);
        String base = template(h, brief);
        return scriptWriter.write(base).map(s -> new Script(s, "gemini")).orElse(new Script(base, "template"));
    }

    String template(Household h, BriefDto b) {
        String parent = h.parents().stream().map(Person::getName).findFirst().orElse("there");
        List<String> lines = new ArrayList<>();
        lines.add("Hi " + parent + ". It's " + Times.fmtDay(b.generatedAt()) + ", here's your evening brief.");
        lines.add(b.headline());
        if (!b.decide().isEmpty()) {
            lines.add("First, the things that need you.");
            for (int i = 0; i < b.decide().size(); i++) {
                BriefDto.Item it = b.decide().get(i);
                lines.add((i + 1) + ". " + it.title().replace(":", ",") + ". " + it.narrative() + (it.dueLabel() == null ? "" : " That's " + it.dueLabel() + "."));
            }
        }
        if (!b.done().isEmpty()) {
            lines.add("Handled for you, no action needed:");
            for (BriefDto.Item it : b.done()) lines.add(it.title().replace(":", ",") + ". " + it.narrative());
        }
        if (!b.later().isEmpty()) lines.add("Parked for later: " + String.join("; ", b.later().stream().map(it -> it.title().replace(":", ",") + (it.dueLabel() == null ? "" : " (" + it.dueLabel() + ")")).toList()) + ".");
        ChoreBoard board = choreService.ensureBoard(h);
        LocalDate day = b.generatedAt().toLocalDate();
        List<String> kidLines = new ArrayList<>();
        for (Person k : h.children()) {
            int wk = board.earnedThisWeek(k.getId(), day);
            int st = board.streak(k.getId(), day);
            if (wk > 0 || st > 0) kidLines.add(k.getName() + " has " + board.balance(k.getId()) + " points" + (wk > 0 ? ", " + wk + " of them this week" : "") + (st >= 2 ? ", and a " + st + "-day streak" : ""));
        }
        if (!kidLines.isEmpty()) lines.add("On the chores board: " + String.join(". ", kidLines) + ".");
        lines.add("That's everything. Have a good night.");
        return String.join("\n", lines);
    }
}
