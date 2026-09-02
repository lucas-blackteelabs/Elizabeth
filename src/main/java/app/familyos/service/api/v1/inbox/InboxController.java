package app.familyos.service.api.v1.inbox;

import app.familyos.service.application.households.DemoHousehold;
import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.pipeline.OrchestratorService;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.signals.Channel;
import app.familyos.service.domain.signals.RawMessage;
import app.familyos.service.domain.signals.Signal;
import app.familyos.service.domain.signals.SignalRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/inbox")
@RequiredArgsConstructor
@Tag(name = "Inbox")
public class InboxController {
    private final OrchestratorService orchestrator;
    private final HouseholdService householdService;
    private final UserService userService;
    private final SignalRepository signalRepository;

    public record InboxRequest(Channel channel, @NotBlank String from, String subject, @NotBlank String body) {
        public RawMessage toRaw() {
            return new RawMessage(channel == null ? Channel.MANUAL : channel, from, subject, body);
        }
    }

    @Operation(summary = "Forward anything: the agents read it, place it, and decide what to do within your trust settings")
    @PostMapping
    public ResponseEntity<OrchestratorService.IngestResult> ingest(@Valid @RequestBody InboxRequest request) {
        Household h = householdService.requireForUser(userService.getAuthenticatedUserId());
        return new ResponseEntity<>(orchestrator.ingest(h.getId(), request.toRaw()), HttpStatus.CREATED);
    }

    @Operation(summary = "Signals received, newest first")
    @GetMapping("/signals")
    public ResponseEntity<List<Signal>> signals() {
        Household h = householdService.requireForUser(userService.getAuthenticatedUserId());
        return ResponseEntity.ok(signalRepository.findAllByHouseholdIdOrderByReceivedAtDesc(h.getId()));
    }

    @Operation(summary = "Sample messages to try")
    @GetMapping("/samples")
    public ResponseEntity<List<RawMessage>> samples() {
        return ResponseEntity.ok(DemoHousehold.inbox());
    }
}
