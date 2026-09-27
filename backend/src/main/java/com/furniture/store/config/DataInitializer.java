package com.furniture.store.config;

import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureAdminUser("funarray47@gmail.com", "Admin@123", "Atelier", "Admin");
    }

    private void ensureAdminUser(String email, String rawPassword, String firstName, String lastName) {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isEmpty()) {
            User admin = new User(
                    email,
                    passwordEncoder.encode(rawPassword),
                    firstName,
                    lastName,
                    "+919876543210",
                    Role.ADMIN,
                    UserStatus.ACTIVE
            );
            userRepository.save(admin);
            log.info("Initialized default administrator account: {}", email);
        } else {
            User user = existing.get();
            boolean updated = false;
            if (user.getRole() != Role.ADMIN) {
                user.setRole(Role.ADMIN);
                updated = true;
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                user.setStatus(UserStatus.ACTIVE);
                updated = true;
            }
            // Ensure password is up to date
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            log.info("Verified administrator account credentials for: {}", email);
        }
    }
}
