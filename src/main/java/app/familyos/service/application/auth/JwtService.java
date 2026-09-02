package app.familyos.service.application.auth;

import app.familyos.service.domain.users.User;
import app.familyos.service.domain.users.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final UserRepository userRepository;

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token.expiration-minutes}")
    private long accessTokenExpirationMinutes;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UserDetails userDetails) {
        User user = userRepository.findByUsernameAndActiveIsTrue(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("name", user.getName());
        claims.put("householdId", user.getHouseholdId());
        long ttl = accessTokenExpirationMinutes * 60 * 1000L;
        return Jwts.builder().claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttl))
                .signWith(signingKey())
                .compact();
    }

    private Claims claims(String token) {
        return Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
    }

    public String extractUsername(String token) {
        return claims(token).getSubject();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        Claims c = claims(token);
        return c.getSubject().equals(userDetails.getUsername()) && c.getExpiration().after(new Date());
    }
}
