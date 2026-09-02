package app.familyos.service.api.v1.auth;

import app.familyos.service.application.auth.AuthenticationService;
import app.familyos.service.application.users.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {
    private final AuthenticationService authenticationService;
    private final UserService userService;

    @Operation(summary = "Sign up and receive tokens")
    @SecurityRequirements()
    @PostMapping("/signup")
    public ResponseEntity<JwtAuthenticationResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return new ResponseEntity<>(JwtAuthenticationResponse.fromDto(authenticationService.signUp(request.toDto())), HttpStatus.CREATED);
    }

    @Operation(summary = "Login (handled by the JWT filter; documented here)")
    @SecurityRequirements()
    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Rotate a refresh token")
    @SecurityRequirements()
    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(JwtAuthenticationResponse.fromDto(authenticationService.refresh(request.getRefreshToken())));
    }

    @Operation(summary = "Sign out everywhere")
    @PostMapping("/signout")
    public ResponseEntity<Void> signOut() {
        authenticationService.signOut(userService.getAuthenticatedUserId());
        return ResponseEntity.noContent().build();
    }
}
