package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Profile("prod & staging")
@ConditionalOnProperty(prefix = "app.mobile-demo-seed", name = "enabled", havingValue = "true", matchIfMissing = false)
@Order(6)
@RequiredArgsConstructor
@Slf4j
public class StagingDemoMobileUserSeeder implements CommandLineRunner {
    private static final String DEMO_PASSWORD = "password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        demoUsers().forEach(this::seedOrUpdate);
        log.info("Staging mobile demo users seeded/verified.");
    }

    private void seedOrUpdate(DemoUser demoUser) {
        User user = userRepository.findByEmail(demoUser.email())
                .orElseGet(() -> User.builder()
                        .email(demoUser.email())
                        .build());

        user.setFullName(demoUser.fullName());
        user.setPhone(demoUser.phone());
        user.setRole(demoUser.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));

        userRepository.save(user);
    }

    private List<DemoUser> demoUsers() {
        return List.of(
                new DemoUser("customer@plumbcommerce.com", "Staging Customer", "5555555601", Role.CUSTOMER),
                new DemoUser("plumber@plumbcommerce.com", "Staging Plumber", "5555555602", Role.PLUMBER),
                new DemoUser("store@plumbcommerce.com", "Staging Store Manager", "5555555603", Role.STORE_MANAGER)
        );
    }

    private record DemoUser(String email, String fullName, String phone, Role role) {
    }
}
