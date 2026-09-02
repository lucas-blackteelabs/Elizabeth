package app.familyos.service.application.auth;

public record JwtAuthenticationDto(String accessToken, String refreshToken) {
}
