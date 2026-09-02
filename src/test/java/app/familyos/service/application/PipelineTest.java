package app.familyos.service.application;

import app.familyos.service.application.agents.IntakeExtractor;
import app.familyos.service.application.calendar.CalendarService;
import app.familyos.service.application.chores.ChoreService;
import app.familyos.service.application.households.DemoHousehold;
import app.familyos.service.application.pipeline.CalendarRules;
import app.familyos.service.application.pipeline.Narrator;
import app.familyos.service.application.pipeline.OrchestratorService;
import app.familyos.service.application.pipeline.TrustPolicy;
import app.familyos.service.domain.calendar.CalendarEvent;
import app.familyos.service.domain.calendar.CalendarEventRepository;
import app.familyos.service.domain.calendar.OutboundMessage;
import app.familyos.service.domain.calendar.OutboundMessageRepository;
import app.familyos.service.domain.calendar.Reminder;
import app.familyos.service.domain.calendar.ReminderRepository;
import app.familyos.service.domain.calendar.SpendEntry;
import app.familyos.service.domain.calendar.SpendEntryRepository;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.chores.ChoreBoardRepository;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.HouseholdRepository;
import app.familyos.service.domain.ledger.LedgerEntry;
import app.familyos.service.domain.ledger.LedgerEntryRepository;
import app.familyos.service.domain.ledger.LedgerState;
import app.familyos.service.domain.proposals.Disposition;
import app.familyos.service.domain.proposals.Proposal;
import app.familyos.service.domain.proposals.ProposalRepository;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalKind;
import app.familyos.service.domain.signals.SignalRepository;
import app.familyos.service.domain.trace.TraceStep;
import app.familyos.service.domain.trace.TraceStepRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** The whole loop against in-memory repositories: eight inputs, one Tuesday evening. */
class PipelineTest {
    private Household h;
    private OrchestratorService orchestrator;
    private final Map<String, CalendarEvent> calendar = new LinkedHashMap<>();
    private final Map<String, LedgerEntry> ledger = new LinkedHashMap<>();
    private final Map<String, Proposal> proposals = new LinkedHashMap<>();
    private final Map<String, Signal> signals = new LinkedHashMap<>();
    private final List<Reminder> reminders = new ArrayList<>();
    private final List<OutboundMessage> messages = new ArrayList<>();
    private final List<SpendEntry> spend = new ArrayList<>();
    private final List<TraceStep> trace = new ArrayList<>();
    private ChoreBoard board;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        h = DemoHousehold.seed("u1");
        h.setTrust(TrustPolicy.defaults(h));
        CalendarRules.expandStanding(h, DemoHousehold.NOW).forEach(e -> calendar.put(e.getId(), e));
        board = ChoreService.defaults(h);

        HouseholdRepository households = mock(HouseholdRepository.class);
        when(households.findById(anyString())).thenReturn(Optional.of(h));
        when(households.save(any())).thenAnswer(i -> i.getArgument(0));
        SignalRepository signalRepo = mock(SignalRepository.class);
        when(signalRepo.save(any())).thenAnswer(i -> { Signal s = i.getArgument(0); signals.put(s.getId(), s); return s; });
        ProposalRepository proposalRepo = mock(ProposalRepository.class);
        when(proposalRepo.save(any())).thenAnswer(i -> { Proposal p = i.getArgument(0); proposals.put(p.getId(), p); return p; });
        when(proposalRepo.findById(anyString())).thenAnswer(i -> Optional.ofNullable(proposals.get(i.getArgument(0))));
        LedgerEntryRepository ledgerRepo = mock(LedgerEntryRepository.class);
        when(ledgerRepo.save(any())).thenAnswer(i -> { LedgerEntry e = i.getArgument(0); ledger.put(e.getId(), e); return e; });
        when(ledgerRepo.findById(anyString())).thenAnswer(i -> Optional.ofNullable(ledger.get(i.getArgument(0))));
        CalendarEventRepository calRepo = mock(CalendarEventRepository.class);
        when(calRepo.saveAll(any())).thenAnswer(i -> { for (CalendarEvent e : (Iterable<CalendarEvent>) i.getArgument(0)) calendar.put(e.getId(), e); return null; });
        ReminderRepository remRepo = mock(ReminderRepository.class);
        when(remRepo.saveAll(any())).thenAnswer(i -> { ((Iterable<Reminder>) i.getArgument(0)).forEach(reminders::add); return null; });
        OutboundMessageRepository msgRepo = mock(OutboundMessageRepository.class);
        when(msgRepo.saveAll(any())).thenAnswer(i -> { ((Iterable<OutboundMessage>) i.getArgument(0)).forEach(messages::add); return null; });
        SpendEntryRepository spendRepo = mock(SpendEntryRepository.class);
        when(spendRepo.saveAll(any())).thenAnswer(i -> { ((Iterable<SpendEntry>) i.getArgument(0)).forEach(spend::add); return null; });
        when(spendRepo.findAllByHouseholdId(anyString())).thenAnswer(i -> new ArrayList<>(spend));
        ChoreBoardRepository boardRepo = mock(ChoreBoardRepository.class);
        when(boardRepo.findByHouseholdId(anyString())).thenAnswer(i -> Optional.of(board));
        when(boardRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        TraceStepRepository traceRepo = mock(TraceStepRepository.class);
        when(traceRepo.saveAll(any())).thenAnswer(i -> { ((Iterable<TraceStep>) i.getArgument(0)).forEach(trace::add); return null; });
        CalendarService calendarService = mock(CalendarService.class);
        when(calendarService.horizon(any())).thenAnswer(i -> new ArrayList<>(calendar.values()));
        IntakeExtractor extractor = mock(IntakeExtractor.class);
        when(extractor.extract(any(), any(), any())).thenReturn(Optional.empty());

        orchestrator = new OrchestratorService(households, signalRepo, proposalRepo, ledgerRepo, calRepo, remRepo, msgRepo, spendRepo, boardRepo, traceRepo, calendarService, extractor, mock(ApplicationEventPublisher.class));
        for (RawMessage raw : DemoHousehold.inbox()) orchestrator.ingest(h.getId(), raw);
    }

    private LedgerEntry entry(SignalKind kind) {
        return ledger.values().stream().filter(e -> e.getKind() == kind).findFirst().orElseThrow();
    }

    @Test
    void eightInputsCompressToFourDecisions() {
        assertThat(ledger.values().stream().filter(e -> e.getState() == LedgerState.AWAITING_DECISION)).hasSize(4);
        assertThat(ledger.values().stream().filter(e -> e.getState() == LedgerState.EXECUTED)).hasSize(1);
        assertThat(ledger.values().stream().filter(e -> e.getState() == LedgerState.SCHEDULED)).hasSize(2);
        assertThat(ledger.values().stream().filter(e -> e.getState() == LedgerState.NOTED)).hasSize(1);
    }

    @Test
    void coachRescheduleIsHandledEndToEnd() {
        CalendarEvent footy = calendar.get("s_footy@2026-09-05");
        assertThat(footy.getStart()).isEqualTo(java.time.LocalDateTime.of(2026, 9, 5, 10, 30));
        assertThat(footy.getDriverId()).isEqualTo("p_tom");
        assertThat(calendar.get("s_swim@2026-09-05").getDriverId()).isEqualTo("p_priya");
        assertThat(entry(SignalKind.SCHEDULE_CHANGE).getState()).isEqualTo(LedgerState.EXECUTED);
    }

    @Test
    void excursionFeeAutoPaidUnderCapAndSignatureStaysWithParent() {
        LedgerEntry e = entry(SignalKind.PERMISSION_REQUEST);
        Proposal p = proposals.get(e.getProposalId());
        var pay = p.getActions().stream().filter(a -> a.getCls() == ActionClass.PAYMENT).findFirst().orElseThrow();
        var sign = p.getActions().stream().filter(a -> a.getCls() == ActionClass.SIGN_FORM).findFirst().orElseThrow();
        assertThat(e.dispositionOf(pay.getId())).contains(Disposition.EXECUTED);
        assertThat(e.dispositionOf(sign.getId())).contains(Disposition.STAGED);
        assertThat(spend.stream().mapToDouble(SpendEntry::getAmount).sum()).isEqualTo(38.0);
        String narrative = Narrator.narrate(p.getActions(), id -> e.dispositionOf(id).orElse(Disposition.SUGGESTED), p.getSummary());
        assertThat(narrative).startsWith("I've put ").contains("paid $38 to Leichhardt Public School").endsWith("I just need your signature.");
    }

    @Test
    void coparentMessageGetsNeutralCounterProposalNeverAutoSent() {
        LedgerEntry e = entry(SignalKind.COPARENT_MESSAGE);
        Proposal p = proposals.get(e.getProposalId());
        var reply = p.getActions().stream().filter(a -> a.getCls() == ActionClass.COPARENT_REPLY).findFirst().orElseThrow();
        assertThat(reply.getDetail()).contains("5:30pm").doesNotContainIgnoringCase("typical");
        assertThat(e.dispositionOf(reply.getId())).contains(Disposition.SUGGESTED);
        assertThat(messages).isEmpty();
        assertThat(p.getAlternatives()).hasSize(2);
    }

    @Test
    void invitationRsvpStatesTheAllergyAndGiftIsWithinCap() {
        Proposal p = proposals.get(entry(SignalKind.INVITATION).getProposalId());
        assertThat(p.getActions().stream().filter(a -> a.getCls() == ActionClass.OUTBOUND_MESSAGE).findFirst().orElseThrow().getDetail()).contains("allergy");
        assertThat(p.getActions().stream().filter(a -> a.getCls() == ActionClass.PURCHASE).findFirst().orElseThrow().getAmount()).isEqualTo(30.0);
        assertThat(p.blocked()).isFalse();
    }

    @Test
    void agentsProposeAChoreAvaCanOwn() {
        assertThat(board.getChores().stream().filter(c -> "agent".equals(c.getSource()) && c.getChildId().equals("c_ava")).map(ChoreBoard.Chore::getTitle)).anyMatch(t -> t.startsWith("Pack your own bag"));
    }

    @Test
    void approvingExecutesStagedActionsAndClimbsTheLadder() {
        LedgerEntry e = entry(SignalKind.INVITATION);
        orchestrator.decide(h.getId(), e.getId(), OrchestratorService.DecisionKind.APPROVE, null);
        assertThat(e.getState()).isEqualTo(LedgerState.EXECUTED);
        assertThat(messages).hasSize(1);
        assertThat(h.trust(ActionClass.OUTBOUND_MESSAGE).getApprovals()).isEqualTo(1);
    }

    @Test
    void approvingAnAlternativeRunsTheSwapInstead() {
        LedgerEntry e = entry(SignalKind.COPARENT_MESSAGE);
        orchestrator.decide(h.getId(), e.getId(), OrchestratorService.DecisionKind.APPROVE, 1);
        assertThat(messages.get(0).getText()).contains("usual 6pm");
    }

    @Test
    void decliningStepsTrustDownUnlessPinned() {
        LedgerEntry e = entry(SignalKind.PERMISSION_REQUEST);
        int before = h.trust(ActionClass.SIGN_FORM).getLevel();
        orchestrator.decide(h.getId(), e.getId(), OrchestratorService.DecisionKind.DECLINE, null);
        assertThat(e.getState()).isEqualTo(LedgerState.DECLINED);
        assertThat(h.trust(ActionClass.SIGN_FORM).getOverrides()).isEqualTo(1);
        assertThat(h.trust(ActionClass.SIGN_FORM).getLevel()).isEqualTo(before);
    }

    @Test
    void ledgerRefusesImpossibleTransitions() {
        LedgerEntry e = entry(SignalKind.FYI);
        org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, () -> e.transition(DemoHousehold.NOW, LedgerState.EXECUTED, "parent", "nope"));
    }
}
