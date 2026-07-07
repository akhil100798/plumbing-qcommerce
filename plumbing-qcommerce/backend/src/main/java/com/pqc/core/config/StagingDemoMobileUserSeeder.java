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
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PlumberKycRepository plumberKycRepository;

    @Override
    @Transactional
    public void run(String... args) {
        demoUsers().forEach(this::seedOrUpdate);

        User customer = userRepository.findByEmail("customer@plumbcommerce.com").orElse(null);
        User plumber = userRepository.findByEmail("plumber@plumbcommerce.com").orElse(null);
        User storeManager = userRepository.findByEmail("store@plumbcommerce.com").orElse(null);

        if (customer == null || plumber == null || storeManager == null) {
            log.warn("Skipping staging mobile E2E seeding because demo users are missing.");
            return;
        }

        // Seed plumber KYC & availability
        plumberKycRepository.findByPlumberId(plumber.getId())
                .orElseGet(() -> plumberKycRepository.save(PlumberKyc.builder()
                        .plumberId(plumber.getId())
                        .status(PlumberKycStatus.APPROVED)
                        .availabilityStatus(PlumberAvailabilityStatus.ONLINE)
                        .aadhaarNumberMasked("XXXX-XXXX-1234")
                        .panNumberMasked("XXXXX1234X")
                        .experienceYears(5)
                        .serviceAreas("Hyderabad")
                        .build()));

        // Seed Store
        Store store = storeRepository.findFirstByManager_Id(storeManager.getId())
                .orElseGet(() -> storeRepository.save(Store.builder()
                        .name("PlumbCommerce Staging Store")
                        .address("100 Render Lane, Hyderabad")
                        .latitude(17.4485)
                        .longitude(78.3741)
                        .manager(storeManager)
                        .build()));

        // Seed Categories
        Category pipes = ensureCategory("Pipes", "PVC, CPVC, and drainage pipes");
        Category fittings = ensureCategory("Fittings", "Joints, tees, elbows, and couplers");
        Category tools = ensureCategory("Tools", "Repair tools and accessories");

        // Seed Products
        List<Product> products = List.of(
                ensureProduct("CPVC-PIPE-12", "CPVC Pipe 1/2 inch", "Half-inch CPVC repair pipe", new BigDecimal("145.00"), pipes),
                ensureProduct("PVC-ELBOW-34", "PVC Elbow 3/4 inch", "3/4 inch elbow fitting", new BigDecimal("35.00"), fittings),
                ensureProduct("PLUMB-TAPE-01", "Thread Seal Tape", "Leak-resistant sealing tape", new BigDecimal("25.00"), tools)
        );

        // Seed Stock
        for (Product product : products) {
            stockRepository.findByStoreIdAndProductId(store.getId(), product.getId())
                    .orElseGet(() -> stockRepository.save(Stock.builder()
                            .store(store)
                            .product(product)
                            .availableQuantity(40)
                            .reservedQuantity(0)
                            .build()));
        }

        // Seed one pending Service Order for the Customer if they don't have any orders
        if (serviceOrderRepository.countByCustomer_Id(customer.getId()) == 0) {
            serviceOrderRepository.save(ServiceOrder.builder()
                    .customer(customer)
                    .store(store)
                    .status(OrderStatus.PENDING)
                    .requestType(RequestType.NEARBY_AUTO)
                    .description("Leaking kitchen sink faucet repair")
                    .customerLatitude(17.4485)
                    .customerLongitude(78.3741)
                    .build());
        }

        log.info("Staging mobile E2E demo data seeded/verified.");
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
                new DemoUser("store@plumbcommerce.com", "Staging Store Manager", "5555555603", Role.STORE_MANAGER),
                new DemoUser("rider@plumbcommerce.com", "Staging Rider", "5555555604", Role.DELIVERY_PARTNER)
        );
    }

    private Category ensureCategory(String name, String description) {
        return categoryRepository.findAll().stream()
                .filter(category -> name.equalsIgnoreCase(category.getName()))
                .findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private Product ensureProduct(String sku, String name, String description, BigDecimal price, Category category) {
        return productRepository.findAll().stream()
                .filter(product -> sku.equalsIgnoreCase(product.getSku()))
                .findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .sku(sku)
                        .name(name)
                        .description(description)
                        .price(price)
                        .category(category)
                        .build()));
    }

    private record DemoUser(String email, String fullName, String phone, Role role) {
    }
}
