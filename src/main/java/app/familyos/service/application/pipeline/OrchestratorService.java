package app.familyos.service.application.pipeline;

import app.familyos.service.application.agents.IntakeExtractor;
import app.familyos.service.application.agents.completion.IntakeCompletion;
import app.familyos.service.application.calendar.CalendarService;
import app.familyos.service.application.exception.ResourceNotFoundException;
import app.familyos.service.application.intake.IntakeRules;
import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.CalendarEventRepository;
import app.familyos.service.domain.calendar.OutboundMessageRepository;
import app.familyos.service.domain.calendar.ReminderRepository;
import app.familyos.service.domain.calendar.SpendEntryRepository;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.chores.ChoreBoardRepository;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.HouseholdRepository;
import app.familyos.service.domain.households.Person;
import app.familyos.service.domain.ledger.LedgerEntry;
import app.familyos.service.domain.ledger.LedgerEntryRepository;
import app.familyos.service.domain.ledger.LedgerState;
import app.familyos.service.domain.proposals.Action;
import app.familyos.service.domain.proposals.Alternative;
import app.familyos.service.domain.proposals.Disposition;
import app.familyos.service.domain.proposals.Proposal;
import app.familyos.service.domain.proposals.ProposalRepository;
import app.familyos.service.domain.proposals.Urgency;
import app.familyos.service.domain.signals.Extracted;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.Requirement;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.domain.signals.SignalRepository;
import app.familyos.service.domain.trace.TraceStepRepository;
import app.familyos.service.infrastructure.time.Times;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * The whole loop for one input:
 * intake → triage → specialists → guardian → trust → execute → ledger.
 * Agents are pure; this service loads their context and persists their output.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrchestratorService {
    private final HouseholdRepository householdRepository;
    private final SignalRepository signalRepository;
    private final ProposalRepository proposalRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ReminderRepository reminderRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final SpendEntryRepository spendEntryRepository;
    private final ChoreBoardRepository choreBoardRepository;
    private final TraceStepRepository traceStepRepository;
    private final CalendarService calendarService;
    private final IntakeExtractor intakeExtractor;
    private final ApplicationEventPublisher eventPublisher;

    public record IngestResult(Signal signal, Proposal proposal, LedgerEntry entry) {
    }

    public IngestResult ingest(String householdId, RawMessage raw) {
        Household h = householdRepository.findById(householdId).orElseThrow(() -> new ResourceNotFoundException("Household not found"));
        calendarService.materialiseStanding(h);
        PipelineContext ctx = new PipelineContext(h, Times.now(h), calendarService.horizon(h),
                choreBoardRepository.findByHouseholdId(h.getId()).orElse(null), spendEntryRepository.findAllByHouseholdId(h.getId()));

        Signal signal = parse(ctx, raw);
        IngestResult result = runPipeline(ctx, signal);
        persist(ctx);
        eventPublisher.publishEvent(new SignalIngestedEvent(h.getId(), signal.getId(), result.entry().getState()));
        return result;
    }

    IngestResult runPipeline(PipelineContext ctx, Signal signal) {
        Household h = ctx.getHousehold();
        signalRepository.save(signal);
        Extracted ex = signal.getExtracted();
        ctx.trace(signal.getId(), "intake", "classify", signal.getKind().name().toLowerCase(Locale.ROOT) + " (" + Math.round(signal.getConfidence() * 100) + "%) · "
                + (ex.getChildIds().isEmpty() ? "no child" : String.join(", ", ex.getChildIds().stream().map(h::personName).toList()))
                + " · " + (ex.getWhen() == null ? "undated" : Times.fmtWhen(ex.getWhen().start(), ex.getWhen().end(), ex.getWhen().allDay()))
                + (ex.getDeadline() == null ? "" : " · due " + ex.getDeadline().toLocalDate()));

        Triage.Result t = Triage.triage(signal, ctx.getNow());
        ctx.trace(signal.getId(), "triage", t.urgency().name().toLowerCase(Locale.ROOT), String.join(" ", t.reasons()));

        SchedulerAgent.Plan plan = SchedulerAgent.schedule(ctx, signal);
        AgentOutput combined = new AgentOutput().merge(plan).merge(LogisticsAgent.run(ctx, signal, plan)).merge(ProcurementAgent.run(ctx, signal))
                .merge(DevelopmentAgent.run(ctx, signal)).merge(CommsAgent.run(ctx, signal, plan));
        GuardianAgent.check(ctx, signal, combined);

        Proposal proposal = Proposal.builder().id("prop_" + UUID.randomUUID().toString().substring(0, 8)).householdId(h.getId()).signalId(signal.getId())
                .title(ex.getTitle()).summary(summarise(signal, combined)).actions(combined.getActions()).alternatives(combined.getAlternatives())
                .urgency(t.urgency()).dueAt(t.dueAt()).flags(combined.getFlags()).build();
        proposal.getRationale().addAll(t.reasons());
        proposal.getRationale().addAll(combined.getRationale());

        LedgerEntry entry = LedgerEntry.builder().id("led_" + UUID.randomUUID().toString().substring(0, 8)).householdId(h.getId()).signalId(signal.getId()).proposalId(proposal.getId())
                .title(proposal.getTitle()).childIds(new ArrayList<>(ex.getChildIds())).kind(signal.getKind()).state(LedgerState.DETECTED).urgency(t.urgency()).dueAt(t.dueAt()).build();
        entry.getHistory().add(new LedgerEntry.LedgerEvent(ctx.getNow(), LedgerState.DETECTED, "agent", "Detected from " + signal.getRaw().channel().name().toLowerCase(Locale.ROOT) + " (" + signal.getRaw().from() + ")."));

        boolean blocked = proposal.blocked();
        for (Action a : proposal.getActions()) {
            boolean verifiedPayee = h.getPlaces().stream().anyMatch(p -> p.isVerifiedPayee() && p.getName().equals(a.getPayee()));
            TrustPolicy.Decision d = blocked ? new TrustPolicy.Decision(Disposition.STAGED, "blocked by policy") : TrustPolicy.dispose(h, a, verifiedPayee);
            if (d.disposition() == Disposition.EXECUTED) Executor.execute(ctx, a, signal.getId(), plan.getCandidate());
            entry.setDisposition(a.getId(), d.disposition());
            ctx.trace(signal.getId(), "trust", d.disposition().name().toLowerCase(Locale.ROOT), a.getTitle() + ": " + d.reason() + ".");
        }
        openEntry(ctx, entry, proposal);
        proposalRepository.save(proposal);
        ledgerEntryRepository.save(entry);
        ctx.trace(signal.getId(), "ledger", entry.getState().name().toLowerCase(Locale.ROOT), entry.getHistory().get(entry.getHistory().size() - 1).note());
        if (signal.getKind() != SignalKind.FYI) ChoreProposer.propose(ctx, signal);
        return new IngestResult(signal, proposal, entry);
    }

    private void openEntry(PipelineContext ctx, LedgerEntry entry, Proposal proposal) {
        boolean needsParent = entry.getDispositions().stream().anyMatch(d -> d.disposition() == Disposition.STAGED || d.disposition() == Disposition.SUGGESTED);
        boolean hasExecuted = entry.getDispositions().stream().anyMatch(d -> d.disposition() == Disposition.EXECUTED);
        if (proposal.blocked()) entry.transition(ctx.getNow(), LedgerState.AWAITING_DECISION, "agent", "Blocked by policy. Needs a parent.");
        else if (needsParent) entry.transition(ctx.getNow(), proposal.getUrgency() == Urgency.LATER ? LedgerState.SCHEDULED : LedgerState.AWAITING_DECISION, "agent", hasExecuted ? "Routine parts done. One decision left for you." : "Prepared. Waiting for your tap.");
        else if (hasExecuted) entry.transition(ctx.getNow(), LedgerState.EXECUTED, "agent", "Handled end to end within your trust settings.");
        else entry.transition(ctx.getNow(), LedgerState.NOTED, "agent", "Nothing to do. Filed for context.");
    }

    Signal parse(PipelineContext ctx, RawMessage raw) {
        Household h = ctx.getHousehold();
        IntakeRules.Parsed parsed = IntakeRules.parse(raw, h, ctx.getNow());
        Signal signal = Signal.builder().id("sig_" + UUID.randomUUID().toString().substring(0, 8)).householdId(h.getId()).receivedAt(ctx.getNow()).raw(raw)
                .kind(parsed.kind()).confidence(parsed.confidence()).extracted(parsed.extracted()).parser("rules").build();
        Optional<IntakeCompletion> llm = intakeExtractor.extract(raw, h, ctx.getNow());
        llm.ifPresent(c -> refine(ctx, signal, c));
        return signal;
    }

    private void refine(PipelineContext ctx, Signal signal, IntakeCompletion c) {
        Household h = ctx.getHousehold();
        Extracted ex = signal.getExtracted();
        String before = signal.getKind() + ex.getChildIds().toString() + ex.getWhen() + ex.getDeadline() + ex.getAmount();
        try {
            if (c.kind() != null) signal.setKind(SignalKind.valueOf(c.kind().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ignored) {
        }
        if (c.title() != null && !c.title().isBlank()) ex.setTitle(c.title());
        if (c.childNames() != null && !c.childNames().isEmpty()) {
            List<String> ids = h.children().stream().filter(k -> c.childNames().stream().anyMatch(n -> n.equalsIgnoreCase(k.getName()))).map(Person::getId).toList();
            if (!ids.isEmpty()) ex.setChildIds(new ArrayList<>(ids));
        }
        if (c.when() != null && c.when().start() != null) ex.setWhen(new Extracted.TimeWindow(parseLocal(c.when().start()), c.when().end() == null ? null : parseLocal(c.when().end()), Boolean.TRUE.equals(c.when().allDay())));
        if (c.previousWhen() != null && c.previousWhen().start() != null) ex.setPreviousWhen(new Extracted.TimeWindow(parseLocal(c.previousWhen().start()), c.previousWhen().end() == null ? null : parseLocal(c.previousWhen().end()), false));
        if (c.deadline() != null && !c.deadline().isBlank()) ex.setDeadline(parseLocal(c.deadline().length() == 10 ? c.deadline() + "T00:00" : c.deadline()));
        if (c.amount() != null) ex.setAmount(c.amount());
        if (c.items() != null && !c.items().isEmpty()) ex.setItems(new ArrayList<>(c.items()));
        if (c.requires() != null && !c.requires().isEmpty()) {
            List<Requirement> reqs = new ArrayList<>();
            for (String r : c.requires()) try {
                reqs.add(Requirement.valueOf(r.toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) {
            }
            if (!reqs.isEmpty()) ex.setRequires(reqs);
        }
        if (c.location() != null && ex.getPlaceId() == null) {
            Optional<app.familyos.service.domain.households.Place> place = h.getPlaces().stream().filter(p -> c.location().toLowerCase(Locale.ROOT).contains(p.getName().toLowerCase(Locale.ROOT))).findFirst();
            ex.setLocationText(place.map(p -> p.getName()).orElse(c.location()));
            place.ifPresent(p -> {
                ex.setPlaceId(p.getId());
                ex.setTravelMinutes(p.getTravelMinutesFromHome());
            });
        }
        if (signal.getKind() == SignalKind.COPARENT_MESSAGE && c.facts() != null && !c.facts().isEmpty()) {
            ex.setTone(new Extracted.Tone(c.hostile() != null ? c.hostile() : ex.getTone() != null && ex.getTone().hostile(), ex.getTone() == null ? 0 : ex.getTone().score(), c.facts(), String.join(" ", c.facts())));
        }
        if (c.summary() != null) ex.getNotes().add(c.summary());
        signal.setParser("llm");
        signal.setConfidence(Math.max(signal.getConfidence(), 0.9));
        String after = signal.getKind() + ex.getChildIds().toString() + ex.getWhen() + ex.getDeadline() + ex.getAmount();
        ctx.trace(signal.getId(), "gemini", "refine", before.equals(after) ? "Agreed with the rules parser." : "Refined: " + (c.summary() == null ? "fields updated" : c.summary()));
    }

    private static LocalDateTime parseLocal(String s) {
        return LocalDateTime.parse(s.length() > 16 ? s.substring(0, 16) : s);
    }

    private static String summarise(Signal signal, AgentOutput out) {
        if (out.getSummary() != null) return out.getSummary();
        Extracted ex = signal.getExtracted();
        if (signal.getKind() == SignalKind.FYI) {
            String b = signal.getRaw().body().replaceAll("\\s+", " ");
            return b.length() > 180 ? b.substring(0, 180) + "…" : b;
        }
        List<String> bits = new ArrayList<>();
        if (ex.getWhen() != null) bits.add(Times.fmtWhen(ex.getWhen().start(), ex.getWhen().end(), ex.getWhen().allDay()));
        if (ex.getLocationText() != null) bits.add(ex.getLocationText());
        if (ex.getAmount() != null && signal.getKind() != SignalKind.PURCHASE_NEED) bits.add("$" + IntakeRules.fmt(ex.getAmount()));
        String head = String.join(" · ", bits);
        if (!head.isEmpty()) return head;
        if (!out.getActions().isEmpty()) return out.getActions().get(0).getTitle();
        return signal.getRaw().subject() == null ? "" : signal.getRaw().subject();
    }

    void persist(PipelineContext ctx) {
        Household h = ctx.getHousehold();
        List<CalendarEvent> touched = ctx.getCalendar().stream().filter(e -> ctx.getTouchedEventIds().contains(e.getId())).toList();
        if (!touched.isEmpty()) calendarEventRepository.saveAll(touched);
        if (!ctx.getNewReminders().isEmpty()) reminderRepository.saveAll(ctx.getNewReminders());
        if (!ctx.getNewMessages().isEmpty()) outboundMessageRepository.saveAll(ctx.getNewMessages());
        if (!ctx.getNewSpend().isEmpty()) spendEntryRepository.saveAll(ctx.getNewSpend());
        if (ctx.isBoardChanged() && ctx.getBoard() != null) choreBoardRepository.save(ctx.getBoard());
        if (!ctx.getTrace().isEmpty()) traceStepRepository.saveAll(ctx.getTrace());
        householdRepository.save(h);
    }

    public enum DecisionKind {APPROVE, DECLINE, SNOOZE}

    /** A parent's tap. Approving executes what was staged (or a chosen alternative) and teaches the trust ladder. */
    public LedgerEntry decide(String householdId, String ledgerId, DecisionKind kind, Integer alternativeIndex) {
        Household h = householdRepository.findById(householdId).orElseThrow(() -> new ResourceNotFoundException("Household not found"));
        LedgerEntry entry = ledgerEntryRepository.findById(ledgerId).filter(e -> e.getHouseholdId().equals(householdId)).orElseThrow(() -> new ResourceNotFoundException("Ledger entry not found"));
        Proposal proposal = proposalRepository.findById(entry.getProposalId()).orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
        PipelineContext ctx = new PipelineContext(h, Times.now(h), calendarService.horizon(h), choreBoardRepository.findByHouseholdId(h.getId()).orElse(null), spendEntryRepository.findAllByHouseholdId(h.getId()));
        List<Action> pending = proposal.getActions().stream().filter(a -> entry.dispositionOf(a.getId()).orElse(Disposition.SUGGESTED) != Disposition.EXECUTED).toList();
        switch (kind) {
            case SNOOZE -> entry.transition(ctx.getNow(), LedgerState.SNOOZED, "parent", "Snoozed until tomorrow's brief.");
            case DECLINE -> {
                for (Action a : pending) TrustPolicy.recordOverride(h, a.getCls());
                entry.transition(ctx.getNow(), LedgerState.DECLINED, "parent", "Declined. Trust for these action types stepped down.");
            }
            case APPROVE -> {
                Alternative alt = alternativeIndex == null || alternativeIndex < 0 || alternativeIndex >= proposal.getAlternatives().size() ? null : proposal.getAlternatives().get(alternativeIndex);
                List<Action> toRun = alt != null ? alt.actions() : pending;
                CalendarEvent candidate = ctx.getCalendar().stream().filter(e -> entry.getSignalId().equals(e.getSourceId())).findFirst().orElse(null);
                for (Action a : toRun) {
                    Executor.execute(ctx, a, entry.getSignalId(), candidate);
                    entry.setDisposition(a.getId(), Disposition.EXECUTED);
                    if (TrustPolicy.recordApproval(h, a.getCls()) && !h.getPromotionsOffered().contains(a.getCls().name())) h.getPromotionsOffered().add(a.getCls().name());
                }
                if (alt != null) {
                    for (Action a : alt.actions()) if (proposal.getActions().stream().noneMatch(x -> x.getId().equals(a.getId()))) proposal.getActions().add(a);
                    for (Action a : pending) if (entry.dispositionOf(a.getId()).orElse(null) != Disposition.EXECUTED) entry.setDisposition(a.getId(), Disposition.OBSERVED);
                    proposalRepository.save(proposal);
                }
                entry.transition(ctx.getNow(), LedgerState.EXECUTED, "parent", alt != null ? "Approved alternative: " + alt.label() + "." : "Approved. Done.");
            }
        }
        ledgerEntryRepository.save(entry);
        persist(ctx);
        eventPublisher.publishEvent(new DecisionMadeEvent(h.getId(), entry.getId(), kind));
        return entry;
    }

    public record SignalIngestedEvent(String householdId, String signalId, LedgerState state) {
    }

    public record DecisionMadeEvent(String householdId, String ledgerId, DecisionKind kind) {
    }

    public void setTrust(Household h, ActionClass cls, int level, Boolean pinned) {
        TrustPolicy.setLevel(h, cls, level, pinned);
        householdRepository.save(h);
    }
}
