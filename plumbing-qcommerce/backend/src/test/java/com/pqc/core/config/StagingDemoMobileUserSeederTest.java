package com.pqc.core.config;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.*;
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
 * Unit tests for {@link StagingDemoMobileUserSeeder}.
 *
 * <p>Validates:
 * <ol>
 *   <li>Correct FixKart QA emails and roles are seeded</li>
 *   <li>Passwords come from SeedProperties (not hardcoded)</li>
 *   <li>Run is idempotent — no duplicates on second execution</li>
 *   <li>Bean loads ONLY for {@code staging} profile</li>
 *   <li>Bean does NOT load for {@code prod} profile only</li>
 *   <li>Bean does NOT load for default profile</li>
 * </ol>
 */
class StagingDemoMobileUserSeederTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private StoreRepository storeRepository;
    private CategoryRepository categoryRepository;
    private ProductRepository productRepository;
    private StockRepository stockRepository;
    private ServiceOrderRepository serviceOrderRepository;
    private PlumberKycRepository plumberKycRepository;
    private LaunchPolicyRepository launchPolicyRepository;
    private SeedProperties seedProperties;

    private Map<String, User> users;
    private List<User> savedUsers;
    private Map<String, com.pqc.core.entity.LaunchPolicy> policies;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        storeRepository = mock(StoreRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        productRepository = mock(ProductRepository.class);
        stockRepository = mock(StockRepository.class);
        serviceOrderRepository = mock(ServiceOrderRepository.class);
        plumberKycRepository = mock(PlumberKycRepository.class);
        launchPolicyRepository = mock(LaunchPolicyRepository.class);
        seedProperties = mock(SeedProperties.class);

        users = new HashMap<>();
        savedUsers = new ArrayList<>();
        policies = new HashMap<>();

        when(seedProperties.getDemoPassword()).thenReturn("QaStagingSecret!");
        when(passwordEncoder.encode("QaStagingSecret!")).thenReturn("bcrypt-qa-password");
        when(userRepository.findByEmail(any())).thenAnswer(inv -> Optional.ofNullable(users.get(inv.getArgument(0))));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            if (user.getId() == null) {
                user.setId((long) (users.size() + 1));
            }
            users.put(user.getEmail(), user);
            savedUsers.add(user);
            return user;
        });

        when(plumberKycRepository.findByPlumberId(any())).thenReturn(Optional.empty());
        when(plumberKycRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(storeRepository.findFirstByManager_Id(any())).thenReturn(Optional.empty());
        when(storeRepository.save(any())).thenAnswer(inv -> {
            var store = inv.getArgument(0);
            return store;
        });

        when(categoryRepository.findAll()).thenReturn(new ArrayList<>());
        when(categoryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(productRepository.findAll()).thenReturn(new ArrayList<>());
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(stockRepository.findByStoreIdAndProductId(any(), any())).thenReturn(Optional.empty());
        when(stockRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(serviceOrderRepository.countByCustomer_Id(any())).thenReturn(0L);
        when(serviceOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(launchPolicyRepository.findFirstByPolicyKey(any())).thenAnswer(inv -> Optional.ofNullable(policies.get(inv.getArgument(0))));
        when(launchPolicyRepository.save(any(com.pqc.core.entity.LaunchPolicy.class))).thenAnswer(inv -> {
            com.pqc.core.entity.LaunchPolicy policy = inv.getArgument(0);
            if (policy.getId() == null) {
                policy.setId((long) (policies.size() + 1));
            }
            policies.put(policy.getPolicyKey(), policy);
            return policy;
        });
    }

    private StagingDemoMobileUserSeeder buildSeeder() {
        return new StagingDemoMobileUserSeeder(
                userRepository, passwordEncoder, storeRepository, categoryRepository,
                productRepository, stockRepository, serviceOrderRepository, plumberKycRepository,
                launchPolicyRepository, seedProperties
        );
    }

    @Test
    @DisplayName("run() creates all six FixKart QA accounts with hashed password and ACTIVE status")
    void runCreatesAllSixFixKartQaAccountsWithCorrectRolesAndActiveStatus() throws Exception {
        buildSeeder().run();

        assertThat(users).containsOnlyKeys(
                "customer.qa@fixkart.com",
                "customer2.qa@fixkart.com",
                "plumber.qa@fixkart.com",
                "plumber2.qa@fixkart.com",
                "store.qa@fixkart.com",
                "admin.qa@fixkart.com"
        );
        assertThat(users.get("customer.qa@fixkart.com").getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(users.get("customer2.qa@fixkart.com").getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(users.get("plumber.qa@fixkart.com").getRole()).isEqualTo(Role.PLUMBER);
        assertThat(users.get("plumber2.qa@fixkart.com").getRole()).isEqualTo(Role.PLUMBER);
        assertThat(users.get("store.qa@fixkart.com").getRole()).isEqualTo(Role.STORE_MANAGER);
        assertThat(users.get("admin.qa@fixkart.com").getRole()).isEqualTo(Role.SUPER_ADMIN);

        assertThat(users.values()).allSatisfy(user -> {
            assertThat(user.getPassword()).isEqualTo("bcrypt-qa-password");
            assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        });
        assertThat(savedUsers).hasSize(6);
    }

    @Test
    @DisplayName("run() uses SeedProperties.getDemoPassword(), not a hardcoded constant")
    void runUsesSeedPropertiesPasswordNotHardcodedConstant() throws Exception {
        buildSeeder().run();

        // Password must come from seedProperties.getDemoPassword() — called once per QA user (6 users)
        verify(seedProperties, atLeast(6)).getDemoPassword();
        verify(passwordEncoder, atLeast(1)).encode("QaStagingSecret!");
        assertThat(users.values()).allSatisfy(u -> assertThat(u.getPassword()).isEqualTo("bcrypt-qa-password"));
    }

    @Test
    @DisplayName("run() is idempotent — no duplicates when called twice")
    void runIsIdempotentNoDuplicatesOnRestart() throws Exception {
        User existingCustomer = User.builder()
                .id(100L)
                .email("customer.qa@fixkart.com")
                .fullName("Old Name")
                .phone("old-phone")
                .password("old-hash")
                .role(Role.ADMIN)
                .status(UserStatus.BLOCKED)
                .build();
        users.put(existingCustomer.getEmail(), existingCustomer);

        StagingDemoMobileUserSeeder seeder = buildSeeder();
        seeder.run();
        seeder.run();

        assertThat(users).hasSize(6);
        assertThat(users.get("customer.qa@fixkart.com").getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(users.get("customer.qa@fixkart.com").getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(users.get("customer.qa@fixkart.com").getPassword()).isEqualTo("bcrypt-qa-password");
    }

    @Test
    @DisplayName("run() provisions SERVICE_LAUNCH policy when absent")
    void runProvisionsServiceLaunchPolicyWhenAbsent() throws Exception {
        buildSeeder().run();

        assertThat(policies).containsKey("SERVICE_LAUNCH");
        com.pqc.core.entity.LaunchPolicy policy = policies.get("SERVICE_LAUNCH");
        assertThat(policy.getPolicyKey()).isEqualTo("SERVICE_LAUNCH");
        assertThat(policy.isActive()).isTrue();
        assertThat(policy.isRosterEnforcementEnabled()).isTrue();
        assertThat(policy.isServiceMaterialEnforcementEnabled()).isFalse();
        assertThat(policy.getCurrency()).isEqualTo("INR");
        assertThat(policy.getOwnedStoreId()).isNull();
        assertThat(policy.getServiceAreaCenterLatitude()).isNull();
        assertThat(policy.getServiceAreaCenterLongitude()).isNull();
        assertThat(policy.getServiceAreaRadiusKm()).isNull();
        assertThat(policy.getVisitFee()).isNull();
        assertThat(policies).hasSize(1);
    }

    @Test
    @DisplayName("run() is idempotent for SERVICE_LAUNCH policy on multiple executions")
    void runIsIdempotentForServiceLaunchPolicy() throws Exception {
        StagingDemoMobileUserSeeder seeder = buildSeeder();
        seeder.run();
        seeder.run();

        assertThat(policies).hasSize(1);
        com.pqc.core.entity.LaunchPolicy policy = policies.get("SERVICE_LAUNCH");
        assertThat(policy.getPolicyKey()).isEqualTo("SERVICE_LAUNCH");
        assertThat(policy.isActive()).isTrue();
    }

    @Test
    @DisplayName("run() preserves existing active SERVICE_LAUNCH policy without mutation")
    void runPreservesExistingActiveServiceLaunchPolicy() throws Exception {
        com.pqc.core.entity.LaunchPolicy existing = com.pqc.core.entity.LaunchPolicy.builder()
                .id(999L)
                .policyKey("SERVICE_LAUNCH")
                .active(true)
                .rosterEnforcementEnabled(false)
                .serviceMaterialEnforcementEnabled(true)
                .ownedStoreId(42L)
                .currency("INR")
                .build();
        policies.put("SERVICE_LAUNCH", existing);

        buildSeeder().run();

        assertThat(policies).hasSize(1);
        com.pqc.core.entity.LaunchPolicy policy = policies.get("SERVICE_LAUNCH");
        assertThat(policy.getId()).isEqualTo(999L);
        assertThat(policy.isRosterEnforcementEnabled()).isFalse();
        assertThat(policy.isServiceMaterialEnforcementEnabled()).isTrue();
        assertThat(policy.getOwnedStoreId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("run() preserves existing inactive SERVICE_LAUNCH policy without duplicate or activation")
    void runPreservesExistingInactiveServiceLaunchPolicy() throws Exception {
        com.pqc.core.entity.LaunchPolicy existing = com.pqc.core.entity.LaunchPolicy.builder()
                .id(888L)
                .policyKey("SERVICE_LAUNCH")
                .active(false)
                .rosterEnforcementEnabled(false)
                .serviceMaterialEnforcementEnabled(false)
                .currency("INR")
                .build();
        policies.put("SERVICE_LAUNCH", existing);

        buildSeeder().run();

        assertThat(policies).hasSize(1);
        com.pqc.core.entity.LaunchPolicy policy = policies.get("SERVICE_LAUNCH");
        assertThat(policy.getId()).isEqualTo(888L);
        assertThat(policy.isActive()).isFalse();
        assertThat(policy.isRosterEnforcementEnabled()).isFalse();
    }

    // ------------------------------------------------------------------ Profile tests

    @Test
    @DisplayName("Bean loads when profile=staging AND app.seed.mobile-qa-enabled=true")
    void beanLoadsWhenStagingProfileAndMobileQaEnabled() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StoreRepository.class, () -> storeRepository)
                .withBean(CategoryRepository.class, () -> categoryRepository)
                .withBean(ProductRepository.class, () -> productRepository)
                .withBean(StockRepository.class, () -> stockRepository)
                .withBean(ServiceOrderRepository.class, () -> serviceOrderRepository)
                .withBean(PlumberKycRepository.class, () -> plumberKycRepository)
                .withBean(LaunchPolicyRepository.class, () -> launchPolicyRepository)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.seed.mobile-qa-enabled=true")
                .withSystemProperties("spring.profiles.active=staging")
                .run(context -> assertThat(context).hasSingleBean(StagingDemoMobileUserSeeder.class));
    }

    @Test
    @DisplayName("Bean does NOT load when profile=prod only (staging seeder must not activate in prod)")
    void beanDoesNotLoadForProdProfileOnly() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StoreRepository.class, () -> storeRepository)
                .withBean(CategoryRepository.class, () -> categoryRepository)
                .withBean(ProductRepository.class, () -> productRepository)
                .withBean(StockRepository.class, () -> stockRepository)
                .withBean(ServiceOrderRepository.class, () -> serviceOrderRepository)
                .withBean(PlumberKycRepository.class, () -> plumberKycRepository)
                .withBean(LaunchPolicyRepository.class, () -> launchPolicyRepository)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.seed.mobile-qa-enabled=true")
                .withSystemProperties("spring.profiles.active=prod")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoMobileUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }

    @Test
    @DisplayName("Bean does NOT load for default (no profile) — seeder is staging-only")
    void beanDoesNotLoadForDefaultProfile() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StoreRepository.class, () -> storeRepository)
                .withBean(CategoryRepository.class, () -> categoryRepository)
                .withBean(ProductRepository.class, () -> productRepository)
                .withBean(StockRepository.class, () -> stockRepository)
                .withBean(ServiceOrderRepository.class, () -> serviceOrderRepository)
                .withBean(PlumberKycRepository.class, () -> plumberKycRepository)
                .withBean(LaunchPolicyRepository.class, () -> launchPolicyRepository)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.seed.mobile-qa-enabled=true")
                // No spring.profiles.active — default profile
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoMobileUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }

    @Test
    @DisplayName("Bean does NOT load when mobile-qa-enabled=false even with staging profile")
    void beanDoesNotLoadWhenPropertyDisabled() {
        new ApplicationContextRunner()
                .withBean(UserRepository.class, () -> userRepository)
                .withBean(PasswordEncoder.class, () -> passwordEncoder)
                .withBean(StoreRepository.class, () -> storeRepository)
                .withBean(CategoryRepository.class, () -> categoryRepository)
                .withBean(ProductRepository.class, () -> productRepository)
                .withBean(StockRepository.class, () -> stockRepository)
                .withBean(ServiceOrderRepository.class, () -> serviceOrderRepository)
                .withBean(PlumberKycRepository.class, () -> plumberKycRepository)
                .withBean(LaunchPolicyRepository.class, () -> launchPolicyRepository)
                .withBean(SeedProperties.class, () -> seedProperties)
                .withBean(StagingDemoMobileUserSeeder.class)
                .withPropertyValues("app.seed.mobile-qa-enabled=false")
                .withSystemProperties("spring.profiles.active=staging")
                .run(context -> {
                    assertThat(context).doesNotHaveBean(StagingDemoMobileUserSeeder.class);
                    verify(userRepository, never()).save(any(User.class));
                });
    }
}
