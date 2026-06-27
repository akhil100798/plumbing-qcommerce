package com.pqc.core.config;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class CatalogDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Ensuring development/demo users...");
        User manager = ensureDevUser("manager@plumbcommerce.com", "Default Store Manager", "1234567890", Role.STORE_MANAGER);
        ensureDevUser("customer@plumbcommerce.com", "Default Customer", "0987654321", Role.CUSTOMER);
        ensureDevUser("admin@plumbcommerce.com", "Default Admin", "5555555555", Role.ADMIN);

        // Development/demo admin users only. Do not use these credentials in production.
        ensureDevUser("superadmin@plumbcommerce.com", "Demo Super Admin", "5555555501", Role.SUPER_ADMIN);
        ensureDevUser("operations@plumbcommerce.com", "Demo Operations Admin", "5555555502", Role.OPERATIONS_ADMIN);
        ensureDevUser("plumbermanager@plumbcommerce.com", "Demo Plumber Manager", "5555555503", Role.PLUMBER_MANAGER);
        ensureDevUser("finance@plumbcommerce.com", "Demo Finance Admin", "5555555504", Role.FINANCE_ADMIN);
        ensureDevUser("support@plumbcommerce.com", "Demo Support Admin", "5555555505", Role.SUPPORT_ADMIN);
        ensureDevUser("marketing@plumbcommerce.com", "Demo Marketing Admin", "5555555506", Role.MARKETING_ADMIN);

        if (categoryRepository.count() > 0) {
            log.info("Catalog already seeded.");
            return;
        }

        Store store = storeRepository.findAll().stream().findFirst()
                .orElseGet(() -> storeRepository.save(Store.builder()
                        .name("PlumbCommerce Central Warehouse")
                        .address("100 Industrial Parkway, Mumbai")
                        .latitude(19.0760)
                        .longitude(72.8777)
                        .manager(manager)
                        .build()));

        log.info("Seeding categories...");
        Category pipes = categoryRepository.save(Category.builder()
                .name("Pipes")
                .description("PVC, CPVC, and metal pipes")
                .build());

        Category fittings = categoryRepository.save(Category.builder()
                .name("Fittings")
                .description("Elbows, Tees, and Couplers")
                .build());

        Category taps = categoryRepository.save(Category.builder()
                .name("Taps")
                .description("Kitchen and Bathroom taps")
                .build());

        Category tools = categoryRepository.save(Category.builder()
                .name("Tools")
                .description("Wrenches, cut tools, and plumbing kits")
                .build());

        log.info("Seeding products...");
        Product cpvcPipe = productRepository.save(Product.builder()
                .sku("CPVC-12-P")
                .name("CPVC Pipe 1/2 inch")
                .description("1/2 inch CPVC pipe, length 10ft, pressure rating SDR 11")
                .price(new BigDecimal("15.50"))
                .imageUrl("http://localhost:8081/images/cpvc-pipe.jpg")
                .category(pipes)
                .build());

        Product pvcPipe = productRepository.save(Product.builder()
                .sku("PVC-34-P")
                .name("PVC Pipe 3/4 inch")
                .description("3/4 inch PVC pipe, length 10ft, Schedule 40")
                .price(new BigDecimal("12.00"))
                .imageUrl("http://localhost:8081/images/pvc-pipe.jpg")
                .category(pipes)
                .build());

        Product elbow = productRepository.save(Product.builder()
                .sku("ELB-12-F")
                .name("Elbow 1/2 inch")
                .description("1/2 inch CPVC 90-degree elbow fitting")
                .price(new BigDecimal("2.50"))
                .imageUrl("http://localhost:8081/images/elbow-fitting.jpg")
                .category(fittings)
                .build());

        Product tee = productRepository.save(Product.builder()
                .sku("TEE-34-F")
                .name("Tee 3/4 inch")
                .description("3/4 inch PVC Tee connector fitting")
                .price(new BigDecimal("3.75"))
                .imageUrl("http://localhost:8081/images/tee-fitting.jpg")
                .category(fittings)
                .build());

        Product brassTap = productRepository.save(Product.builder()
                .sku("TAP-KT-B")
                .name("Kitchen Brass Tap")
                .description("Heavy-duty wall mounted kitchen tap with dual flow")
                .price(new BigDecimal("45.00"))
                .imageUrl("http://localhost:8081/images/brass-tap.jpg")
                .category(taps)
                .build());

        Product cutter = productRepository.save(Product.builder()
                .sku("TL-P-CUT")
                .name("Pipe Cutter Pro")
                .description("Heavy-duty spring-loaded pipe cutter tool")
                .price(new BigDecimal("22.50"))
                .imageUrl("http://localhost:8081/images/pipe-cutter.jpg")
                .category(tools)
                .build());

        log.info("Seeding store stock levels...");
        List<Store> allStores = storeRepository.findAll();
        List<Product> allProducts = List.of(cpvcPipe, pvcPipe, elbow, tee, brassTap, cutter);

        for (Store s : allStores) {
            for (Product p : allProducts) {
                stockRepository.save(Stock.builder()
                        .store(s)
                        .product(p)
                        .availableQuantity(100)
                        .reservedQuantity(0)
                        .build());
            }
        }

        log.info("Seeding complete. Default warehouse coordinates: Lat: {}, Lon: {}", store.getLatitude(), store.getLongitude());
    }

    private User ensureDevUser(String email, String fullName, String phone, Role role) {
        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    log.info("Demo user already present: {} ({})", email, existingUser.getRole());
                    return existingUser;
                })
                .orElseGet(() -> {
                    log.info("Creating demo user: {} ({})", email, role);
                    return userRepository.save(User.builder()
                            .email(email)
                            .fullName(fullName)
                            .password(passwordEncoder.encode("password"))
                            .phone(phone)
                            .role(role)
                            .build());
                });
    }
}
