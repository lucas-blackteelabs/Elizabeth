package app.familyos.service.api.v1.brief;

import app.familyos.service.application.brief.BriefDto;
import app.familyos.service.application.brief.BriefService;
import app.familyos.service.application.households.HouseholdService;
import app.familyos.service.application.users.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/brief")
@RequiredArgsConstructor
@Tag(name = "Brief")
public class BriefController {
    private final BriefService briefService;
    private final HouseholdService householdService;
    private final UserService userService;

    @Operation(summary = "Tonight's brief: decide, done, later, fyi")
    @GetMapping
    public ResponseEntity<BriefDto> brief() {
        return ResponseEntity.ok(briefService.compose(householdService.requireForUser(userService.getAuthenticatedUserId())));
    }

    @Operation(summary = "The brief as a spoken script")
    @GetMapping("/script")
    public ResponseEntity<BriefService.Script> script() {
        return ResponseEntity.ok(briefService.script(householdService.requireForUser(userService.getAuthenticatedUserId())));
    }
}
