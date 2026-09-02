package app.familyos.service.api.configuration;

import app.familyos.service.api.v1.auth.JwtAuthenticationResponse;
import app.familyos.service.application.auth.JwtService;
import app.familyos.service.application.auth.RefreshTokenService;
import app.familyos.service.application.exception.ResourceNotFoundException;
import app.familyos.service.domain.users.User;
import app.familyos.service.domain.users.UserRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.ArrayList;

/** POST /v1/auth/login {username, password} → {accessToken, refreshToken}, the contract the mobile and portal clients share. */
@AllArgsConstructor
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        try {
            ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            User user = mapper.readValue(request.getInputStream(), User.class);
            return authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword(), new ArrayList<>()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @SneakyThrows
    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        UserDetails principal = (UserDetails) authResult.getPrincipal();
        User user = userRepository.findByUsernameAndActiveIsTrue(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();
        String accessToken = jwtService.generateToken(principal);
        new ObjectMapper().writeValue(response.getWriter(), JwtAuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build());
    }
}
