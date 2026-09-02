package app.familyos.service.api.v1.households;

import app.familyos.service.application.agents.completion.HouseholdDraftCompletion;
import app.familyos.service.application.households.DemoHousehold;
import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.households.ActionClass;
import app.familyos.service.domain.households.Household;
import app.familyos.service.domain.households.Policy;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/households")
@RequiredArgsConstructor
@Tag(name = "Households")
public class HouseholdController {
    private final HouseholdService householdService;
    private final UserService userService;

    public record HouseholdResponse(Household household, boolean aiReady, String aiModel) {
    }

    public record DraftRequest(@NotBlank String text) {
    }

    public record DraftResponse(HouseholdDraftCompletion draft, String source, List<Policy> suggestedPolicies) {
    }

    public record CommitRequest(HouseholdDraftCompletion draft, List<String> disabledPolicies, String trustPreset) {
    }

    public record PolicyRequest(Boolean enabled, Map<String, Object> params) {
    }

    public record TrustRequest(ActionClass cls, Integer level, Boolean pinned, String preset) {
    }

    @Operation(summary = "My household, or 404 if onboarding has not happened")
    @GetMapping("/me")
    public ResponseEntity<HouseholdResponse> me() {
        Household h = householdService.requireForUser(userService.getAuthenticatedUserId());
        return ResponseEntity.ok(new HouseholdResponse(h, householdService.aiReady(), householdService.aiModel()));
    }

    @Operation(summary = "Onboarding: draft a household from a paragraph")
    @PostMapping("/onboarding/draft")
    public ResponseEntity<DraftResponse> draft(@Valid @RequestBody DraftRequest request) {
        if (request.text().trim().length() < 20) throw new IllegalArgumentException("Tell me a little more: names, ages, school, the regular activities.");
        HouseholdService.Draft d = householdService.draft(request.text());
        return ResponseEntity.ok(new DraftResponse(d.draft(), d.source(), householdService.suggestPolicies(d.draft())));
    }

    @Operation(summary = "Onboarding: sample description")
    @GetMapping("/onboarding/sample")
    public ResponseEntity<Map<String, String>> sample() {
        return ResponseEntity.ok(Map.of("text", DemoHousehold.SAMPLE_INTRO));
    }

    @Operation(summary = "Onboarding: create the household from a reviewed draft")
    @PostMapping("/onboarding/commit")
    public ResponseEntity<HouseholdResponse> commit(@RequestBody CommitRequest request) {
        if (request.draft() == null || ((request.draft().children() == null || request.draft().children().isEmpty()) && (request.draft().adults() == null || request.draft().adults().isEmpty()))) {
            throw new IllegalArgumentException("I need at least one person to set up the household.");
        }
        Household h = householdService.commit(userService.getAuthenticatedUserId(), request.draft(), request.disabledPolicies(), request.trustPreset());
        return ResponseEntity.ok(new HouseholdResponse(h, householdService.aiReady(), householdService.aiModel()));
    }

    @Operation(summary = "Load the demo family and run its inbox")
    @PostMapping("/demo")
    public ResponseEntity<HouseholdResponse> demo() {
        Household h = householdService.loadDemo(userService.getAuthenticatedUserId());
        return ResponseEntity.ok(new HouseholdResponse(h, householdService.aiReady(), householdService.aiModel()));
    }

    @Operation(summary = "Toggle or tune a house rule")
    @PutMapping("/me/policies/{policyId}")
    public ResponseEntity<Household> policy(@PathVariable String policyId, @RequestBody PolicyRequest request) {
        Household h = householdService.requireForUser(userService.getAuthenticatedUserId());
        return ResponseEntity.ok(householdService.setPolicy(h, policyId, request.enabled(), request.params()));
    }

    @Operation(summary = "Set a trust level, pin it, or apply a preset (cautious | balanced | hands-off)")
    @PutMapping("/me/trust")
    public ResponseEntity<Household> trust(@RequestBody TrustRequest request) {
        Household h = householdService.requireForUser(userService.getAuthenticatedUserId());
        if (request.preset() != null) return ResponseEntity.ok(householdService.applyPreset(h, request.preset()));
        return ResponseEntity.ok(householdService.setTrust(h, request.cls(), request.level() == null ? h.trust(request.cls()).getLevel() : request.level(), request.pinned()));
    }
}
