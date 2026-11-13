package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class ProductionOperatorBootstrapRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductionOperatorBootstrapProperties properties;

    @Override
    @Transactional
    public void run(String... args) {
        if (!properties.isEnabled()) {
            return;
        }

        String email = properties.getEmail();
        String password = properties.getPassword();

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("[BOOTSTRAP] Initial operator bootstrap is enabled, but email or password is blank. Failing closed without creating user.");
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            log.info("[BOOTSTRAP] Initial operator with configured email already exists. Skipping bootstrap (no password or record mutation).");
            return;
        }

        Role role;
        try {
            role = properties.getRole() != null && !properties.getRole().isBlank()
                    ? Role.valueOf(properties.getRole().trim().toUpperCase())
                    : Role.ADMIN;
        } catch (IllegalArgumentException e) {
            log.warn("[BOOTSTRAP] Invalid bootstrap role '{}'; failing closed.", properties.getRole());
            return;
        }

        User user = User.builder()
                .email(normalizedEmail)
                .fullName(properties.getName() != null && !properties.getName().isBlank() ? properties.getName().trim() : "Initial Administrator")
                .phone(properties.getPhone() != null && !properties.getPhone().isBlank() ? properties.getPhone().trim() : "5555500001")
                .password(passwordEncoder.encode(password))
                .role(role)
                .status(UserStatus.ACTIVE)
                .authProvider("LOCAL")
                .profileComplete(true)
                .phoneVerified(true)
                .build();

        userRepository.save(user);
        log.info("[BOOTSTRAP] Initial operator successfully provisioned with role {}. Please disable FIXKART_BOOTSTRAP_ADMIN_ENABLED.", role);
    }
}
