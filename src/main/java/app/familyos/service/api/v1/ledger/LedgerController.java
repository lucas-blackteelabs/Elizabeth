package app.familyos.service.api.v1.ledger;

import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.pipeline.OrchestratorService;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.calendar.OutboundMessage;
import app.familyos.service.domain.calendar.OutboundMessageRepository;
import app.familyos.service.domain.calendar.SpendEntry;
import app.familyos.service.domain.calendar.SpendEntryRepository;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.ledger.LedgerEntry;
import app.familyos.service.domain.ledger.LedgerEntryRepository;
import app.familyos.service.domain.proposals.Proposal;
import app.familyos.service.domain.proposals.ProposalRepository;
import app.familyos.service.domain.trace.TraceStep;
import app.familyos.service.domain.trace.TraceStepRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/ledger")
@RequiredArgsConstructor
@Tag(name = "Ledger")
public class LedgerController {
    private final OrchestratorService orchestrator;
    private final HouseholdService householdService;
    private final UserService userService;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final ProposalRepository proposalRepository;
    private final TraceStepRepository traceStepRepository;
    private final OutboundMessageRepository outboundMessageRepository;
    private final SpendEntryRepository spendEntryRepository;

    public record DecisionRequest(OrchestratorService.DecisionKind kind, Integer alternativeIndex) {
    }

    private Household me() {
        return householdService.requireForUser(userService.getAuthenticatedUserId());
    }

    @Operation(summary = "Every commitment, with its history")
    @GetMapping
    public ResponseEntity<List<LedgerEntry>> entries() {
        return ResponseEntity.ok(ledgerEntryRepository.findAllByHouseholdId(me().getId()));
    }

    @Operation(summary = "Approve, decline or snooze a ledger entry")
    @PostMapping("/{ledgerId}/decision")
    public ResponseEntity<LedgerEntry> decide(@PathVariable String ledgerId, @RequestBody DecisionRequest request) {
        return ResponseEntity.ok(orchestrator.decide(me().getId(), ledgerId, request.kind(), request.alternativeIndex()));
    }

    @GetMapping("/proposals")
    public ResponseEntity<List<Proposal>> proposals() {
        return ResponseEntity.ok(proposalRepository.findAllByHouseholdId(me().getId()));
    }

    @Operation(summary = "Agent trace: why it did what it did")
    @GetMapping("/trace")
    public ResponseEntity<List<TraceStep>> trace(@RequestParam(required = false) String signalId) {
        List<TraceStep> all = traceStepRepository.findAllByHouseholdIdOrderByAt(me().getId());
        return ResponseEntity.ok(signalId == null ? all : all.stream().filter(t -> signalId.equals(t.getSignalId())).toList());
    }

    @GetMapping("/messages")
    public ResponseEntity<List<OutboundMessage>> messages() {
        return ResponseEntity.ok(outboundMessageRepository.findAllByHouseholdIdOrderByAtDesc(me().getId()));
    }

    @GetMapping("/spend")
    public ResponseEntity<List<SpendEntry>> spend() {
        return ResponseEntity.ok(spendEntryRepository.findAllByHouseholdId(me().getId()));
    }
}
