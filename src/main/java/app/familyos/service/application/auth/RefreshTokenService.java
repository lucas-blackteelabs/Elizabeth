package app.familyos.service.application.auth;

import app.familyos.service.application.exception.BadRequestException;
import app.familyos.service.domain.users.RefreshToken;
import app.familyos.service.domain.users.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token.expiration-minutes}")
    private long expirationMinutes;

    public RefreshToken createRefreshToken(String userId) {
        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .token(UUID.randomUUID().toString())
                .expiresAt(Instant.now().plusSeconds(expirationMinutes * 60))
                .build();
        return refreshTokenRepository.save(token);
    }

    /** Rotates: the presented token is consumed and a fresh one issued. */
    public RefreshToken rotate(String presented) {
        RefreshToken existing = refreshTokenRepository.findByToken(presented)
                .orElseThrow(() -> new BadRequestException("Refresh token is not valid"));
        refreshTokenRepository.delete(existing);
        if (existing.getExpiresAt().isBefore(Instant.now())) throw new BadRequestException("Refresh token has expired");
        return createRefreshToken(existing.getUserId());
    }

    public void revokeAll(String userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }
}
