package app.familyos.service.application.households;

import app.familyos.service.application.agents.AiAvailability;
import app.familyos.service.application.agents.HouseholdDraftAgent;
import app.familyos.service.application.agents.completion.HouseholdDraftCompletion;
import app.familyos.service.application.calendar.CalendarService;
import app.familyos.service.application.chores.ChoreService;
import app.familyos.service.application.exception.ResourceNotFoundException;
import app.familyos.service.application.pipeline.OrchestratorService;
import app.familyos.service.application.pipeline.TrustPolicy;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.calendar.CalendarEventRepository;
import app.familyos.service.domain.calendar.OutboundMessageRepository;
import app.familyos.service.domain.calendar.ReminderRepository;
import app.familyos.service.domain.calendar.SpendEntryRepository;
import app.familyos.service.domain.chores.ChoreBoardRepository;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.HouseholdRepository;
import app.familyos.service.domain.households.Policy;
import app.familyos.service.domain.ledger.LedgerEntryRepository;
import app.familyos.service.domain.proposals.ProposalRepository;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.SignalRepository;
import app.familyos.service.domain.trace.TraceStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class HouseholdService {
    private final HouseholdRepository householdRepository;
    private final UserService userService;
    private final HouseholdDraftAgent draftAgent;
    private final CalendarService calendarService;
    private final ChoreService choreService;
    private final OrchestratorService orchestrator;
    private final AiAvailability ai;
    private final SignalRepository signalRepository;
    private final ProposalRepository proposalRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ReminderRepository reminderRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final SpendEntryRepository spendEntryRepository;
    private final ChoreBoardRepository choreBoardRepository;
    private final TraceStepRepository traceStepRepository;

    public Optional<Household> findForUser(String userId) {
        return householdRepository.findByOwnerUserId(userId);
    }

    public Household requireForUser(String userId) {
        return findForUser(userId).orElseThrow(() -> new ResourceNotFoundException("No household yet. Finish onboarding first."));
    }

    public record Draft(HouseholdDraftCompletion draft, String source) {
    }

    public Draft draft(String text) {
        Optional<HouseholdDraftCompletion> byAgent = draftAgent.draft(text);
        return byAgent.map(d -> new Draft(d, "gemini")).orElseGet(() -> new Draft(OnboardingRules.draft(text), "rules"));
    }

    public List<Policy> suggestPolicies(HouseholdDraftCompletion draft) {
        return OnboardingRules.suggestPolicies(draft);
    }

    public Household commit(String userId, HouseholdDraftCompletion draft, List<String> disabledPolicyIds, String trustPreset) {
        findForUser(userId).ifPresent(this::wipe);
        Household h = OnboardingRules.toHousehold(draft, userId);
        if (disabledPolicyIds != null) h.getPolicies().stream().filter(p -> disabledPolicyIds.contains(p.getId())).forEach(p -> p.setEnabled(false));
        h.setTrust(TrustPolicy.defaults(h));
        applyPreset(h, trustPreset);
        return install(userId, h);
    }

    public Household loadDemo(String userId) {
        findForUser(userId).ifPresent(this::wipe);
        Household h = DemoHousehold.seed(userId);
        h.setTrust(TrustPolicy.defaults(h));
        install(userId, h);
        for (RawMessage raw : DemoHousehold.inbox()) orchestrator.ingest(h.getId(), raw);
        return householdRepository.findById(h.getId()).orElseThrow();
    }

    private Household install(String userId, Household h) {
        Household saved = householdRepository.save(h);
        userService.attachHousehold(userId, saved.getId());
        calendarService.materialiseStanding(saved);
        choreService.ensureBoard(saved);
        log.info("Installed household {} for user {}", saved.getId(), userId);
        return saved;
    }

    private void wipe(Household old) {
        String id = old.getId();
        signalRepository.deleteAllByHouseholdId(id);
        proposalRepository.deleteAllByHouseholdId(id);
        ledgerEntryRepository.deleteAllByHouseholdId(id);
        calendarEventRepository.deleteAllByHouseholdId(id);
        reminderRepository.deleteAllByHouseholdId(id);
        outboundMessageRepository.deleteAllByHouseholdId(id);
        spendEntryRepository.deleteAllByHouseholdId(id);
        choreBoardRepository.deleteAllByHouseholdId(id);
        traceStepRepository.deleteAllByHouseholdId(id);
        householdRepository.delete(old);
    }

    public Household setPolicy(Household h, String policyId, Boolean enabled, Map<String, Object> params) {
        Policy p = h.getPolicies().stream().filter(x -> x.getId().equals(policyId)).findFirst().orElseThrow(() -> new ResourceNotFoundException("No such rule"));
        if (enabled != null) p.setEnabled(enabled);
        if (params != null) p.getParams().putAll(params);
        return householdRepository.save(h);
    }

    public Household setTrust(Household h, ActionClass cls, int level, Boolean pinned) {
        orchestrator.setTrust(h, cls, level, pinned);
        return h;
    }

    public Household applyPreset(Household h, String preset) {
        if (preset == null) return h;
        Map<ActionClass, Integer> levels = switch (preset) {
            case "cautious" -> Map.of(ActionClass.CALENDAR_WRITE, 2, ActionClass.REMINDER, 3, ActionClass.SIGN_FORM, 2, ActionClass.PAYMENT, 1, ActionClass.OUTBOUND_MESSAGE, 1, ActionClass.COPARENT_REPLY, 1, ActionClass.PURCHASE, 1, ActionClass.ENROLMENT, 1);
            case "hands-off" -> Map.of(ActionClass.CALENDAR_WRITE, 4, ActionClass.REMINDER, 4, ActionClass.SIGN_FORM, 2, ActionClass.PAYMENT, 3, ActionClass.OUTBOUND_MESSAGE, 3, ActionClass.COPARENT_REPLY, 1, ActionClass.PURCHASE, 2, ActionClass.ENROLMENT, 2);
            default -> Map.of(ActionClass.CALENDAR_WRITE, 3, ActionClass.REMINDER, 4, ActionClass.SIGN_FORM, 2, ActionClass.PAYMENT, 2, ActionClass.OUTBOUND_MESSAGE, 2, ActionClass.COPARENT_REPLY, 1, ActionClass.PURCHASE, 2, ActionClass.ENROLMENT, 1);
        };
        levels.forEach((cls, level) -> TrustPolicy.setLevel(h, cls, level, cls == ActionClass.SIGN_FORM ? Boolean.TRUE : null));
        return householdRepository.save(h);
    }

    public boolean aiReady() {
        return ai.ready();
    }

    public String aiModel() {
        return ai.model();
    }
}
