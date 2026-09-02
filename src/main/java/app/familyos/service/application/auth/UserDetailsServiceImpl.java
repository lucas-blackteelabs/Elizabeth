package app.familyos.service.application.auth;

import app.familyos.service.domain.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsernameAndActiveIsTrue(username)
                .map(u -> new org.springframework.security.core.userdetails.User(u.getUsername(), u.getPassword(), List.of()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
