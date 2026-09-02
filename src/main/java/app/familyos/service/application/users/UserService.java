package app.familyos.service.application.users;

import app.familyos.service.application.exception.BadRequestException;
import app.familyos.service.application.exception.ResourceNotFoundException;
import app.familyos.service.domain.users.User;
import app.familyos.service.domain.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(UserDto dto) {
        String username = dto.getUsername().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) throw new BadRequestException("An account with that email already exists");
        User user = User.builder()
                .name(dto.getName())
                .username(username)
                .password(passwordEncoder.encode(dto.getPassword()))
                .timeZone(dto.getTimeZone() == null ? "Australia/Sydney" : dto.getTimeZone())
                .build();
        log.info("Creating user {}", username);
        return userRepository.save(user);
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetails details)) throw new ResourceNotFoundException("Not authenticated");
        return userRepository.findByUsernameAndActiveIsTrue(details.getUsername()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public String getAuthenticatedUserId() {
        return getAuthenticatedUser().getId();
    }

    public void attachHousehold(String userId, String householdId) {
        User user = getUserById(userId);
        user.setHouseholdId(householdId);
        userRepository.save(user);
    }
}
