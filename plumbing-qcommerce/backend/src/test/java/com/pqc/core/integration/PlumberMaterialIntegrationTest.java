package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.CheckoutService;
import com.pqc.core.service.PlumberMaterialService;
import com.pqc.core.service.ServiceOrderService;
import com.pqc.core.dto.CartItemDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for Phase 3: Plumber Marketplace & Combined Workflows.
 *
 * Tests the complete mid-job material request lifecycle:
 *   1. Plumber raises material request → ServiceOrder status → COMBINED_ORDER
 *   2. Customer confirms payment → ServiceOrder reverts to IN_PROGRESS
 *   3. Billing engine aggregates delivered parts charge + 10% referral commission
 *   4. Guard rails: non-plumber cannot raise requests, wrong status throws
 */
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class PlumberMaterialIntegrationTest {

    @Autowired
    ServiceOrderRepository serviceOrderRepository;

    @Autowired
    ProductOrderRepository productOrderRepository;

    @Autowired
    OutboxEventRepository outboxRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    StoreRepository storeRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    StockRepository stockRepository;

    @Autowired
    InventoryReservationRepository reservationRepository;

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    ServiceOrderService serviceOrderService;

    @Autowired
    CheckoutService checkoutService;

    @Autowired
    PlumberMaterialService plumberMaterialService;

    private User customer;
    private User plumber;
    private Store store;
    private ServiceOrder serviceOrder;
    private Category category;

    @BeforeEach
    void setUp() {
        // Clean all dependent tables
        reservationRepository.deleteAll();
        reservationRepository.flush();

        productOrderRepository.deleteAll();
        productOrderRepository.flush();

        serviceOrderRepository.deleteAll();
        serviceOrderRepository.flush();

        outboxRepository.deleteAll();
        outboxRepository.flush();

        stockRepository.deleteAll();
        stockRepository.flush();

        productRepository.deleteAll();
        productRepository.flush();

        categoryRepository.deleteAll();
        categoryRepository.flush();

        storeRepository.deleteAll();
        storeRepository.flush();

        userRepository.deleteAll();
        userRepository.flush();

        // Create test users
        customer = userRepository.save(User.builder()
                .fullName("Test Customer")
                .email("test.customer@pqc.com")
                .password("hashed")
                .phone("1234567890")
                .role(Role.CUSTOMER)
                .build());

        plumber = userRepository.save(User.builder()
                .fullName("Test Plumber")
                .email("test.plumber@pqc.com")
                .password("hashed")
                .phone("0987654321")
                .role(Role.PLUMBER)
                .build());

        User manager = userRepository.save(User.builder()
                .fullName("Test Manager")
                .email("test.manager@pqc.com")
                .password("hashed")
                .phone("1122334455")
                .role(Role.STORE_MANAGER)
                .build());

        // Create test store
        store = storeRepository.save(Store.builder()
                .name("PQC Store")
                .address("123 Main St")
                .latitude(12.9716)
                .longitude(77.5946)
                .manager(manager)
                .build());

        // Create test category
        category = categoryRepository.save(Category.builder()
                .name("Plumbing Parts")
                .description("Default plumbing parts category")
                .build());

        // Create a service order and force status to IN_PROGRESS bypassing @PrePersist
        serviceOrder = serviceOrderRepository.save(ServiceOrder.builder()
                .customer(customer)
                .plumber(plumber)
                .description("Pipe leak in kitchen")
                .requestType(RequestType.NEARBY_AUTO)
                .customerLatitude(12.9716)
                .customerLongitude(77.5946)
                .build());
        serviceOrder.setStatus(OrderStatus.IN_PROGRESS);
        serviceOrder = serviceOrderRepository.saveAndFlush(serviceOrder);

        // Default to plumber authentication
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        plumber.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + Role.PLUMBER.name()))));
    }

    // ========== 1. Material Request Creation ==========

    @Test
    void givenInProgressJob_whenPlumberRaisesMaterialRequest_thenStatusBecomesComminedOrder() {
        // Create product and stock for the store
        Product product = productRepository.save(Product.builder()
                .sku("PVC-001")
                .name("PVC Pipe 1\"")
                .price(new BigDecimal("150.00"))
                .category(category)
                .build());

        stockRepository.save(Stock.builder()
                .product(product)
                .store(store)
                .availableQuantity(50)
                .reservedQuantity(0)
                .build());

        // Act — plumber requests 2 units of PVC pipe
        List<CartItemDTO> items = List.of(new CartItemDTO(product.getId(), 2));
        ProductOrder materialOrder = plumberMaterialService.createMaterialRequest(
                serviceOrder.getId(), store.getId(), items);

        // Assert ProductOrder is linked
        assertThat(materialOrder.getServiceOrder()).isNotNull();
        assertThat(materialOrder.getServiceOrder().getId()).isEqualTo(serviceOrder.getId());

        // Assert ServiceOrder promoted to COMBINED_ORDER
        ServiceOrder updated = serviceOrderRepository.findById(serviceOrder.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.COMBINED_ORDER);

        // Assert OutboxEvent was published
        List<OutboxEvent> events = outboxRepository.findAll();
        assertThat(events).anyMatch(e -> "MATERIAL_REQUEST_CREATED".equals(e.getEventType()));
    }

    @Test
    void givenMaterialRequest_whenCustomerConfirms_thenServiceOrderReturnsToInProgress() {
        Product product = productRepository.save(Product.builder()
                .sku("ELBOW-001")
                .name("Elbow Joint")
                .price(new BigDecimal("80.00"))
                .category(category)
                .build());

        stockRepository.save(Stock.builder()
                .product(product).store(store)
                .availableQuantity(20).reservedQuantity(0)
                .build());

        // Plumber raises request
        List<CartItemDTO> items = List.of(new CartItemDTO(product.getId(), 1));
        ProductOrder materialOrder = plumberMaterialService.createMaterialRequest(
                serviceOrder.getId(), store.getId(), items);

        assertThat(materialOrder.getStatus()).isEqualTo(ProductOrderStatus.PENDING);

        // Customer confirms payment
        checkoutService.confirmPayment(materialOrder.getId());

        // ServiceOrder must revert to IN_PROGRESS
        ServiceOrder updated = serviceOrderRepository.findById(serviceOrder.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);

        // ProductOrder must be CONFIRMED
        ProductOrder confirmed = productOrderRepository.findById(materialOrder.getId()).orElseThrow();
        assertThat(confirmed.getStatus()).isEqualTo(ProductOrderStatus.CONFIRMED);

        // OutboxEvent must be MATERIAL_ORDER_CONFIRMED
        List<OutboxEvent> events = outboxRepository.findAll();
        assertThat(events).anyMatch(e -> "MATERIAL_ORDER_CONFIRMED".equals(e.getEventType()));
    }

    // ========== 2. Billing Engine — Combined Parts Aggregation ==========

    @Test
    void givenDeliveredMaterialOrder_whenJobCompleted_thenPartsAndCommissionAggregated() {
        // Directly create a DELIVERED product order linked to the service order
        // (simulating that it was already dispatched and confirmed)
        ProductOrder deliveredOrder = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store)
                .status(ProductOrderStatus.DELIVERED)
                .serviceOrder(serviceOrder)
                .totalAmount(new BigDecimal("480.00"))
                .build());

        // Manually set startedAt for billing calculation
        serviceOrder.setStartedAt(java.time.LocalDateTime.now().minusMinutes(90));
        serviceOrderRepository.save(serviceOrder);

        // Act — complete the job (no extra cash charges)
        ServiceOrder completed = serviceOrderService.completeOrder(serviceOrder.getId(), null);

        // Labor = 1.5h * 300 = 450.00
        assertThat(completed.getLaborCharge()).isEqualByComparingTo("450.00");

        // Parts = 480.00 (from delivered product order)
        assertThat(completed.getPartsCharge()).isEqualByComparingTo("480.00");

        // Referral commission = 10% of 480 = 48.00
        assertThat(completed.getReferralCommission()).isEqualByComparingTo("48.00");

        // Total = 450 + 480 + 50 (platform fee) = 980.00
        assertThat(completed.getTotalAmount()).isEqualByComparingTo("980.00");

        assertThat(completed.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void givenNoDeliveredParts_whenJobCompleted_thenZeroPartsAndZeroCommission() {
        serviceOrder.setStartedAt(java.time.LocalDateTime.now().minusMinutes(30));
        serviceOrderRepository.save(serviceOrder);

        ServiceOrder completed = serviceOrderService.completeOrder(serviceOrder.getId(), null);

        assertThat(completed.getPartsCharge()).isEqualByComparingTo("0.00");
        assertThat(completed.getReferralCommission()).isEqualByComparingTo("0.00");
        // Labor minimum = 0.5h * 300 = 150, Total = 150 + 0 + 50 = 200
        assertThat(completed.getTotalAmount()).isEqualByComparingTo("200.00");
    }

    // ========== 3. Guard Rails ==========

    @Test
    void givenPendingServiceOrder_whenPlumberRaisesMaterialRequest_thenThrows() {
        serviceOrder.setStatus(OrderStatus.PENDING);
        serviceOrderRepository.save(serviceOrder);

        List<CartItemDTO> items = List.of(new CartItemDTO(1L, 1));

        assertThatThrownBy(() ->
                plumberMaterialService.createMaterialRequest(serviceOrder.getId(), store.getId(), items))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("IN_PROGRESS or COMBINED_ORDER");
    }

    @Test
    void givenNewOrderStatus_isDefinedInEnum() {
        // Ensure COMBINED_ORDER is present in the enum
        assertThat(OrderStatus.COMBINED_ORDER).isNotNull();
    }
}
