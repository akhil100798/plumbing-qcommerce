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

/**
 * Staging-only admin QA user seeder for FixKart.
 *
 * <p>Activation requirements (ALL must be true):
 * <ul>
 *   <li>{@code SPRING_PROFILES_ACTIVE} contains {@code staging}</li>
 *   <li>{@code APP_SEED_STAGING_ADMIN_ENABLED=true} (env var → {@code app.seed.staging-admin-enabled})</li>
 * </ul>
 *
 * <p>This seeder MUST NOT run in production. The {@code @Profile("staging")} annotation
 * ensures it is never instantiated when only the {@code prod} profile is active.
 *
 * <p>All seeding is idempotent — restarting staging does not duplicate records.
 * Passwords come from {@code app.seed.demo-password} (env: {@code APP_SEED_DEMO_PASSWORD}).
 * Passwords are NEVER committed to source code.
 */
@Component
@Profile("staging")
@ConditionalOnProperty(prefix = "app.seed", name = "staging-admin-enabled", havingValue = "true", matchIfMissing = false)
@Order(5)
@RequiredArgsConstructor
@Slf4j
public class StagingDemoAdminUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties seedProperties;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("StagingDemoAdminUserSeeder: provisioning staging admin QA accounts...");
        stagingAdminUsers().forEach(this::seedOrUpdate);
        log.info("StagingDemoAdminUserSeeder: staging admin provisioning complete.");
    }

    private void seedOrUpdate(StagingUser stagingUser) {
        User user = userRepository.findByEmail(stagingUser.email())
                .orElseGet(() -> User.builder()
                        .email(stagingUser.email())
                        .build());

        user.setFullName(stagingUser.fullName());
        user.setPhone(stagingUser.phone());
        user.setRole(stagingUser.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode(seedProperties.getDemoPassword()));

        userRepository.save(user);
        log.debug("StagingDemoAdminUserSeeder: upserted {} ({})", stagingUser.email(), stagingUser.role());
    }

    private List<StagingUser> stagingAdminUsers() {
        return List.of(
                // FixKart QA admin account — used by automation
                new StagingUser("admin.qa@fixkart.com",           "QA Administrator",           "5555500006", Role.SUPER_ADMIN),
                // Legacy @plumbcommerce.com staging admin accounts (retained for demo/admin portal compat)
                new StagingUser("superadmin@plumbcommerce.com",   "Staging Super Admin",         "5555555501", Role.SUPER_ADMIN),
                new StagingUser("operations@plumbcommerce.com",   "Staging Operations Admin",    "5555555502", Role.OPERATIONS_ADMIN),
                new StagingUser("finance@plumbcommerce.com",      "Staging Finance Admin",       "5555555503", Role.FINANCE_ADMIN),
                new StagingUser("support@plumbcommerce.com",      "Staging Support Admin",       "5555555504", Role.SUPPORT_ADMIN),
                new StagingUser("plumbermanager@plumbcommerce.com","Staging Plumber Manager",    "5555555505", Role.PLUMBER_MANAGER),
                new StagingUser("marketing@plumbcommerce.com",    "Staging Marketing Admin",     "5555555506", Role.MARKETING_ADMIN)
        );
    }

    private record StagingUser(String email, String fullName, String phone, Role role) {}
}