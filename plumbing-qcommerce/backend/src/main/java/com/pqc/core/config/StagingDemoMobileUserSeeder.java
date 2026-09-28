package com.pqc.core.config;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Staging-only QA user seeder for FixKart E2E automation.
 *
 * <p>Activation requirements (ALL must be true):
 * <ul>
 *   <li>{@code SPRING_PROFILES_ACTIVE} contains {@code staging}</li>
 *   <li>{@code APP_SEED_MOBILE_QA_ENABLED=true} (env var → {@code app.seed.mobile-qa-enabled})</li>
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
@ConditionalOnProperty(prefix = "app.seed", name = "mobile-qa-enabled", havingValue = "true", matchIfMissing = false)
@Order(6)
@RequiredArgsConstructor
@Slf4j
public class StagingDemoMobileUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PlumberKycRepository plumberKycRepository;
    private final SeedProperties seedProperties;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("StagingDemoMobileUserSeeder: provisioning FixKart QA accounts...");

        qaUsers().forEach(this::seedOrUpdate);

        // Resolve seeded users by their stable natural key (email)
        User customer  = requireUser("customer.qa@fixkart.com");
        User customer2 = requireUser("customer2.qa@fixkart.com");
        User plumber   = requireUser("plumber.qa@fixkart.com");
        User plumber2  = requireUser("plumber2.qa@fixkart.com");
        User storeMgr  = requireUser("store.qa@fixkart.com");

        // Provision Plumber 1 KYC (APPROVED, ONLINE — eligible for jobs)
        ensurePlumberKyc(plumber, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.ONLINE,
                "Hyderabad, Secunderabad", 5, "XXXX-XXXX-1234", "ABCDE1234F");

        // Provision Plumber 2 KYC (APPROVED, ONLINE — eligible for jobs)
        ensurePlumberKyc(plumber2, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.ONLINE,
                "Hyderabad, Banjara Hills", 3, "XXXX-XXXX-5678", "FGHIJ5678K");

        // Provision QA Store (associated with store.qa)
        Store store = ensureStore(storeMgr);

        // Provision plumbing categories
        Category pipes    = ensureCategory("Pipes",    "PVC, CPVC, and drainage pipes");
        Category fittings = ensureCategory("Fittings", "Joints, tees, elbows, and couplers");
        Category tools    = ensureCategory("Tools",    "Repair tools and accessories");

        // Provision products — sufficient stock (qty=50) for normal flow
        // and low-stock (qty=2) for rejection/partial-approval negative test
        Product productA = ensureProduct("QA-CPVC-PIPE-12", "CPVC Pipe 1/2 inch (QA)",
                "Half-inch CPVC repair pipe — QA sufficient stock", new BigDecimal("145.00"), pipes);
        Product productB = ensureProduct("QA-PVC-ELBOW-34", "PVC Elbow 3/4 inch (QA)",
                "3/4 inch elbow fitting — QA sufficient stock", new BigDecimal("35.00"), fittings);
        Product productC = ensureProduct("QA-THREAD-TAPE-01", "Thread Seal Tape (QA)",
                "Leak-resistant sealing tape — QA sufficient stock", new BigDecimal("25.00"), tools);
        Product productD = ensureProduct("QA-LOW-STOCK-01", "Pipe Wrench (QA Low-Stock)",
                "Pipe wrench — intentionally LOW stock for negative test", new BigDecimal("299.00"), tools);

        // Seed stock levels — sufficient for productA/B/C, low for productD
        ensureStock(store, productA, 50, 0);
        ensureStock(store, productB, 50, 0);
        ensureStock(store, productC, 50, 0);
        ensureStock(store, productD, 2, 0);  // low-stock negative test

        // Seed one pending service order for customer.qa if none exist
        if (serviceOrderRepository.countByCustomer_Id(customer.getId()) == 0) {
            serviceOrderRepository.save(ServiceOrder.builder()
                    .customer(customer)
                    .store(store)
                    .status(OrderStatus.PENDING)
                    .requestType(RequestType.NEARBY_AUTO)
                    .description("QA: Leaking kitchen sink faucet repair")
                    .customerLatitude(17.4485)
                    .customerLongitude(78.3741)
                    .build());
        }

        log.info("StagingDemoMobileUserSeeder: QA provisioning complete. " +
                "Users=6, Store=1 (id={}), Products=4 (3 sufficient, 1 low-stock)", store.getId());
    }

    // ------------------------------------------------------------------ helpers

    private void seedOrUpdate(QaUser qaUser) {
        User user = userRepository.findByEmail(qaUser.email())
                .orElseGet(() -> User.builder().email(qaUser.email()).build());

        user.setFullName(qaUser.fullName());
        user.setPhone(qaUser.phone());
        user.setRole(qaUser.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setPassword(passwordEncoder.encode(seedProperties.getDemoPassword()));

        userRepository.save(user);
        log.debug("StagingDemoMobileUserSeeder: upserted {} ({})", qaUser.email(), qaUser.role());
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException(
                        "StagingDemoMobileUserSeeder: expected QA user not found after seeding: " + email));
    }

    private List<QaUser> qaUsers() {
        return List.of(
                new QaUser("customer.qa@fixkart.com",  "QA Customer One",     "5555500001", Role.CUSTOMER),
                new QaUser("customer2.qa@fixkart.com", "QA Customer Two",     "5555500002", Role.CUSTOMER),
                new QaUser("plumber.qa@fixkart.com",   "QA Plumber One",      "5555500003", Role.PLUMBER),
                new QaUser("plumber2.qa@fixkart.com",  "QA Plumber Two",      "5555500004", Role.PLUMBER),
                new QaUser("store.qa@fixkart.com",     "QA Store Manager",    "5555500005", Role.STORE_MANAGER),
                new QaUser("admin.qa@fixkart.com",     "QA Administrator",    "5555500006", Role.SUPER_ADMIN)
        );
    }

    private void ensurePlumberKyc(User plumber, PlumberKycStatus status,
                                   PlumberAvailabilityStatus availability,
                                   String serviceAreas, int experienceYears,
                                   String aadhaarMasked, String panMasked) {
        PlumberKyc kyc = plumberKycRepository.findByPlumberId(plumber.getId())
                .orElseGet(() -> PlumberKyc.builder()
                        .plumberId(plumber.getId())
                        .aadhaarNumberMasked(aadhaarMasked)
                        .panNumberMasked(panMasked)
                        .experienceYears(experienceYears)
                        .serviceAreas(serviceAreas)
                        .status(status)
                        .availabilityStatus(availability)
                        .build());
        // Ensure KYC fields are up-to-date even on re-run
        kyc.setStatus(status);
        kyc.setAvailabilityStatus(availability);
        kyc.setServiceAreas(serviceAreas);
        kyc.setExperienceYears(experienceYears);
        plumberKycRepository.save(kyc);
    }

    private Store ensureStore(User manager) {
        return storeRepository.findFirstByManager_Id(manager.getId())
                .orElseGet(() -> storeRepository.save(Store.builder()
                        .name("FixKart QA Staging Store")
                        .address("1 QA Test Lane, Hyderabad")
                        .latitude(17.4485)
                        .longitude(78.3741)
                        .manager(manager)
                        .build()));
    }

    private Category ensureCategory(String name, String description) {
        return categoryRepository.findAll().stream()
                .filter(c -> name.equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private Product ensureProduct(String sku, String name, String description,
                                   BigDecimal price, Category category) {
        return productRepository.findAll().stream()
                .filter(p -> sku.equalsIgnoreCase(p.getSku()))
                .findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .sku(sku)
                        .name(name)
                        .description(description)
                        .price(price)
                        .category(category)
                        .build()));
    }

    private void ensureStock(Store store, Product product, int available, int reserved) {
        stockRepository.findByStoreIdAndProductId(store.getId(), product.getId())
                .orElseGet(() -> stockRepository.save(Stock.builder()
                        .store(store)
                        .product(product)
                        .availableQuantity(available)
                        .reservedQuantity(reserved)
                        .build()));
    }

    private record QaUser(String email, String fullName, String phone, Role role) {}
}
