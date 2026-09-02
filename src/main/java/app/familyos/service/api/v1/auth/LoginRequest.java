package app.familyos.service.api.v1.auth;

import lombok.Data;

/** Documented for OpenAPI only; the JwtAuthenticationFilter handles POST /v1/auth/login. */
@Data
public class LoginRequest {
    private String username;
    private String password;
}
