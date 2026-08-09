package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link StagingDemoAdminUserSeeder}.
 *
 * <p>Validates:
 * <ol>
 *   <li>admin.qa@fixkart.com (SUPER_ADMIN) and legacy admin accounts are seeded</li>
 *   <li>Passwords come from SeedProperties (not hardcoded)</li>
 *   <li>Run is idempotent — no duplicates on second execution</li>
 *   <li>Bean loads ONLY for {@code staging} profile</li>
 *   <li>Bean does NOT load for {@code prod} profile only</li>
 *   <li>Bean does NOT load for default profile</li>
 * </ol>
 */
class StagingDemoAdminUserSeederTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private SeedProperties seedProperties;
    private Map<String, User> users;
    private List<User> savedUsers;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        seedProperties = mock(SeedProperties.class);
        users = new HashMap<>();
        savedUsers = new ArrayList<>();

        when(seedProperties.getDemoPassword()).thenReturn("QaStagingSecret!");
        when(passwordEncoder.encode("QaStagingSecret!")).thenReturn("bcrypt-qa-password");
        when(userRepository.findByEmail(any())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            users.put(user.getEmail(), user);
            savedUsers.add(user);
            return user;
        });
    }

    private StagingDemoAdminUserSeeder buildSeeder() {
        return new StagingDemoAdminUserSeeder(userRepository, passwordEncoder, seedProperties);
    }

    @Test
    @DisplayName("run() creates admin.qa@fixkart.com and all legacy staging admin accounts")
    void runCreatesAllExpectedStagingAdminAccounts() throws Exception {
        buildSeeder().run();

        // Must include the new FixKart QA admin account
        assertThat(users).containsKey("admin.qa@fixkart.com");
        assertThat(users.get("admin.qa@fixkart.com").getRole()).isEqualTo(Role.SUPER_ADMIN);

        // Must also include legacy @plumbcommerce.com admin accounts for demo/admin-portal compat
        assertThat(users).containsKeys(
                "superadmin@plumbcommerce.com",
                "operations@plumbcommerce.com",
                "finance@plumbcommerce.com",
                "support@plumbcommerce.com",
                "plumbermanager@plumbcommerce.com",
                "marketing@plumbcommerce.com"
        );
        assertThat(users.get("superadmin@plumbcommerce.com").getRole()).isEqualTo(Role.SUPER_ADMIN);
        assertThat(users.get("operations@plumbcommerce.com").getRole()).isEqualTo(Role.OPERATIONS_ADMIN);
        assertThat(users.get("finance@plumbcommerce.com").getRole()).isEqualTo(Role.FINANCE_ADMIN);
        assertThat(users.get("support@plumbcommerce.com").getRole()).isEqualTo(Role.SUPPORT_ADMIN);
        assertThat(users.get("plumbermanager@plumbcommerce.com").getRole()).isEqualTo(Role.PLUMBER_MANAGER);
        assertThat(users.get("marketing@plumbcommerce.com").getRole()).isEqualTo(Role.MARKETING_ADMIN);

        assertThat(users.values()).allSatisfy(user -> {
            assertThat(user.getPassword()).isEqualTo("bcrypt-qa-password");
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        });
        assertThat(savedUsers).hasSize(7); // 1 QA + 6 legacy
    }

    @Test
    @DisplayName("run() uses SeedProperties.getDemoPassword(), not a hardcoded constant")
    void runUsesSeedPropertiesPasswordNotHardcodedConstant() throws Exception {
        buildSeeder().run();

        verify(seedProperties, atLeast(7)).getDemoPassword();
        verify(passwordEncoder, atLeast(1)).encode("QaStagingSecret!");
        assertThat(users.values()).allSatisfy(u -> assertThat(u.getPassword()).isEqualTo("bcrypt-qa-password"));
    }

    @Test
    @DisplayName("run() is idempotent — no duplicates when called twice")
    void runIsIdempotentNoDuplicatesOnRestart() throws Exception {
        User existing = User.builder()
                .email("superadmin@plumbcommerce.com")
                .fullName("Old Name")
                .phone("old-phone")
                .password("old-hash")
                .role(Role.ADMIN)
                .status(UserStatus.BLOCKED)
                .build();
        users.put(existing.getEmail(), existing);

        StagingDemoAdminUserSeeder seeder = buildSeeder();
        seeder.run();
        seeder.run();

        assertThat(users).hasSize(7); // No duplicates
        assertThat(users.get("superadmin@plumbcommerce.com").getRole()).isEqualTo(Role.SUPER_ADMIN);
        assertThat(users.get("superadmin@plumbcommerce.com").getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(users.get("superadmin@plumbcommerce.com").getPassword()).isEqualTo("bcrypt-qa-password");
    }

    // ------------------------------------------------------------------ Profile tests

    @Test
    @DisplayName("Bean loads when profile=staging AND app.seed.staging-admin-enabled=true")
    void beanLoadsWhenStagingProfileAndStagingAdminEnabled() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.seed.staging-admin-enabled=true")
                .withSystemProperties("spring.profiles.active=staging")
                .run(context -> assertThat(context).hasSingleBean(StagingDemoAdminUserSeeder.class));
    }

    @Test
    @DisplayName("Bean does NOT load when profile=prod only (staging seeder must not activate in prod)")
    void beanDoesNotLoadForProdProfileOnly() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.seed.staging-admin-enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoAdminUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }

    @Test
    @DisplayName("Bean does NOT load for default profile — seeder is staging-only")
    void beanDoesNotLoadForDefaultProfile() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.seed.staging-admin-enabled=true")
                // No spring.profiles.active — default profile
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoAdminUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }

    @Test
    @DisplayName("Bean does NOT load when staging-admin-enabled=false even with staging profile")
    void beanDoesNotLoadWhenPropertyDisabled() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.seed.staging-admin-enabled=false")
                .withSystemProperties("spring.profiles.active=staging")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoAdminUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }
}