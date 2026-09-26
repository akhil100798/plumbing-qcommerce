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
@ConditionalOnProperty(prefix = "app.demo-seed", name = "enabled", havingValue = "true", matchIfMissing = false)
@Order(5)
@RequiredArgsConstructor
@Slf4j
public class StagingDemoAdminUserSeeder implements CommandLineRunner {
    private static final String DEMO_PASSWORD = "password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        demoUsers().forEach(this::seedOrUpdate);
        log.info("Staging demo admin users seeded/verified.");
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
                new DemoUser("superadmin@plumbcommerce.com", "Staging Super Admin", "5555555501", Role.SUPER_ADMIN),
                new DemoUser("operations@plumbcommerce.com", "Staging Operations Admin", "5555555502", Role.OPERATIONS_ADMIN),
                new DemoUser("finance@plumbcommerce.com", "Staging Finance Admin", "5555555503", Role.FINANCE_ADMIN),
                new DemoUser("support@plumbcommerce.com", "Staging Support Admin", "5555555504", Role.SUPPORT_ADMIN),
                new DemoUser("plumbermanager@plumbcommerce.com", "Staging Plumber Manager", "5555555505", Role.PLUMBER_MANAGER),
                new DemoUser("marketing@plumbcommerce.com", "Staging Marketing Admin", "5555555506", Role.MARKETING_ADMIN)
        );
    }

    private record DemoUser(String email, String fullName, String phone, Role role) {
    }
}