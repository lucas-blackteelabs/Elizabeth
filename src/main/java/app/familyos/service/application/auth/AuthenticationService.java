package app.familyos.service.application.auth;

import app.familyos.service.application.users.UserDto;
import app.familyos.service.application.users.UserService;
import app.familyos.service.domain.users.RefreshToken;
import app.familyos.service.domain.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserDetailsService userDetailsService;

    /** Sign-up returns tokens straight away so onboarding is one continuous flow. */
    public JwtAuthenticationDto signUp(UserDto dto) {
        User user = userService.createUser(dto);
        return tokensFor(user);
    }

    public JwtAuthenticationDto refresh(String refreshToken) {
        RefreshToken rotated = refreshTokenService.rotate(refreshToken);
        User user = userService.getUserById(rotated.getUserId());
        String access = jwtService.generateToken(userDetailsService.loadUserByUsername(user.getUsername()));
        return new JwtAuthenticationDto(access, rotated.getToken());
    }

    public void signOut(String userId) {
        refreshTokenService.revokeAll(userId);
    }

    private JwtAuthenticationDto tokensFor(User user) {
        String access = jwtService.generateToken(userDetailsService.loadUserByUsername(user.getUsername()));
        String refresh = refreshTokenService.createRefreshToken(user.getId()).getToken();
        return new JwtAuthenticationDto(access, refresh);
    }
}
