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

class StagingDemoMobileUserSeederTest {
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
    void runCreatesExpectedMobileUsersWithHashedPasswordAndActiveStatus() throws Exception {
        StagingDemoMobileUserSeeder seeder = new StagingDemoMobileUserSeeder(userRepository, passwordEncoder);

        seeder.run();

        assertThat(users).containsOnlyKeys(
                "customer@plumbcommerce.com",
                "plumber@plumbcommerce.com",
                "store@plumbcommerce.com"
        );
        assertThat(users.get("customer@plumbcommerce.com").getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(users.get("plumber@plumbcommerce.com").getRole()).isEqualTo(Role.PLUMBER);
        assertThat(users.get("store@plumbcommerce.com").getRole()).isEqualTo(Role.STORE_MANAGER);
        assertThat(users.values()).allSatisfy(user -> {
            assertThat(user.getPassword()).isEqualTo("bcrypt-password");
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        });
        assertThat(savedUsers).hasSize(3);
    }

    @Test
    void runUpdatesExistingUsersWithoutCreatingDuplicates() throws Exception {
        User existing = User.builder()
                .email("customer@plumbcommerce.com")
                .fullName("Old Customer")
                .phone("old-phone")
                .password("old-hash")
                .role(Role.ADMIN)
                .status(UserStatus.BLOCKED)
                .build();
        users.put(existing.getEmail(), existing);

        StagingDemoMobileUserSeeder seeder = new StagingDemoMobileUserSeeder(userRepository, passwordEncoder);

        seeder.run();
        seeder.run();

        assertThat(users).hasSize(3);
        assertThat(users.get("customer@plumbcommerce.com").getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(users.get("customer@plumbcommerce.com").getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(users.get("customer@plumbcommerce.com").getPassword()).isEqualTo("bcrypt-password");
    }

    @Test
    void beanLoadsForProdStagingWhenMobileDemoSeedEnabled() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.mobile-demo-seed.enabled=true")
                .withSystemProperties("spring.profiles.active=prod,staging");

        runner.run(context -> assertThat(context).hasSingleBean(StagingDemoMobileUserSeeder.class));
    }

    @Test
    void beanIsNotLoadedForRealProdWhenStagingProfileMissing() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.mobile-demo-seed.enabled=true")
                .withSystemProperties("spring.profiles.active=prod");

        runner.run(context -> assertThat(context).doesNotHaveBean(StagingDemoMobileUserSeeder.class));
        verify(userRepository, never()).save(any(User.class));
    }
}
