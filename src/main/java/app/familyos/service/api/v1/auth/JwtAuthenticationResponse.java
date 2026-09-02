package app.familyos.service.api.v1.auth;

import app.familyos.service.application.auth.JwtAuthenticationDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthenticationResponse {
    private String accessToken;
    private String refreshToken;

    public static JwtAuthenticationResponse fromDto(JwtAuthenticationDto dto) {
        return JwtAuthenticationResponse.builder().accessToken(dto.accessToken()).refreshToken(dto.refreshToken()).build();
    }
}
