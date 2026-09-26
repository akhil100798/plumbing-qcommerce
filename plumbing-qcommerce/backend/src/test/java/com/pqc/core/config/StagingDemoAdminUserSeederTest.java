package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StagingDemoAdminUserSeederTest {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private Map<String, User> users;
    private List<User> savedUsers;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        users = new HashMap<>();
        savedUsers = new ArrayList<>();

        when(passwordEncoder.encode("password")).thenReturn("bcrypt-password");
        when(userRepository.findByEmail(any())).thenAnswer(invocation -> Optional.ofNullable(users.get(invocation.getArgument(0))));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            users.put(user.getEmail(), user);
            savedUsers.add(user);
            return user;
        });
    }

    @Test
    void runCreatesExpectedStagingAdminUsersWithHashedPasswordAndActiveStatus() throws Exception {
        StagingDemoAdminUserSeeder seeder = new StagingDemoAdminUserSeeder(userRepository, passwordEncoder);

        seeder.run();

        assertThat(users).containsOnlyKeys(
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
            assertThat(user.getPassword()).isEqualTo("bcrypt-password");
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        });
        assertThat(savedUsers).hasSize(6);
    }

    @Test
    void runUpdatesExistingUsersWithoutCreatingDuplicates() throws Exception {
        User existing = User.builder()
                .email("superadmin@plumbcommerce.com")
                .fullName("Old Name")
                .phone("old-phone")
                .password("old-hash")
                .role(Role.ADMIN)
                .status(UserStatus.BLOCKED)
                .build();
        users.put(existing.getEmail(), existing);

        StagingDemoAdminUserSeeder seeder = new StagingDemoAdminUserSeeder(userRepository, passwordEncoder);

        seeder.run();
        seeder.run();

        assertThat(users).hasSize(6);
        assertThat(users.get("superadmin@plumbcommerce.com").getRole()).isEqualTo(Role.SUPER_ADMIN);
        assertThat(users.get("superadmin@plumbcommerce.com").getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(users.get("superadmin@plumbcommerce.com").getPassword()).isEqualTo("bcrypt-password");
    }

    @Test
    void beanLoadsForProdStagingWhenDemoSeedEnabled() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.demo-seed.enabled=true")
                .withSystemProperties("spring.profiles.active=prod,staging");

        runner.run(context -> assertThat(context).hasSingleBean(StagingDemoAdminUserSeeder.class));
    }

    @Test
    void beanIsNotLoadedForRealProdWhenStagingProfileMissing() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StagingDemoAdminUserSeeder.class)
                .withPropertyValues("app.demo-seed.enabled=true")
                .withSystemProperties("spring.profiles.active=prod");

        runner.run(context -> assertThat(context).doesNotHaveBean(StagingDemoAdminUserSeeder.class));
        verify(userRepository, never()).save(any(User.class));
    }
}