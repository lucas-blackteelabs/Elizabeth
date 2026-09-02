package app.familyos.service.api.v1.chores;

import app.familyos.service.application.chores.ChoreService;
import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.chores.ChoreBoard;
import app.familyos.service.domain.households.Household;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/chores")
@RequiredArgsConstructor
@Tag(name = "Chores")
public class ChoreController {
    private final ChoreService choreService;
    private final HouseholdService householdService;
    private final UserService userService;

    public record ChoreRequest(String childId, String title, Integer points, ChoreBoard.Cadence cadence) {
    }

    public record ClaimRequest(String childId, String rewardId) {
    }

    public record RewardRequest(String title, Integer cost) {
    }

    private Household me() {
        return householdService.requireForUser(userService.getAuthenticatedUserId());
    }

    @Operation(summary = "The board with per-child points, streaks and what is due today")
    @GetMapping
    public ResponseEntity<ChoreService.BoardView> board() {
        return ResponseEntity.ok(choreService.view(me()));
    }

    @PostMapping("/{choreId}/complete")
    public ResponseEntity<ChoreService.BoardView> complete(@PathVariable String choreId) {
        Household h = me();
        choreService.complete(h, choreId);
        return ResponseEntity.ok(choreService.view(h));
    }

    @PostMapping("/{choreId}/undo")
    public ResponseEntity<ChoreService.BoardView> undo(@PathVariable String choreId) {
        Household h = me();
        choreService.undo(h, choreId);
        return ResponseEntity.ok(choreService.view(h));
    }

    @PostMapping
    public ResponseEntity<ChoreService.BoardView> add(@RequestBody ChoreRequest r) {
        Household h = me();
        choreService.add(h, r.childId(), r.title(), r.points() == null ? 5 : r.points(), r.cadence() == null ? ChoreBoard.Cadence.DAILY : r.cadence());
        return ResponseEntity.ok(choreService.view(h));
    }

    @DeleteMapping("/{choreId}")
    public ResponseEntity<ChoreService.BoardView> remove(@PathVariable String choreId) {
        Household h = me();
        choreService.remove(h, choreId);
        return ResponseEntity.ok(choreService.view(h));
    }

    @PostMapping("/claims")
    public ResponseEntity<ChoreService.BoardView> claim(@RequestBody ClaimRequest r) {
        Household h = me();
        choreService.claim(h, r.childId(), r.rewardId());
        return ResponseEntity.ok(choreService.view(h));
    }

    @PostMapping("/claims/{claimId}/approve")
    public ResponseEntity<ChoreService.BoardView> approve(@PathVariable String claimId) {
        Household h = me();
        choreService.approve(h, claimId);
        return ResponseEntity.ok(choreService.view(h));
    }

    @PostMapping("/rewards")
    public ResponseEntity<ChoreService.BoardView> reward(@RequestBody RewardRequest r) {
        Household h = me();
        choreService.addReward(h, r.title(), r.cost() == null ? 30 : r.cost());
        return ResponseEntity.ok(choreService.view(h));
    }
}
