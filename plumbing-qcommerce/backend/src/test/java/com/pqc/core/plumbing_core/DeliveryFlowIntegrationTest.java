package com.pqc.core.plumbing_core;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.CheckoutService;
import com.pqc.core.service.DeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class DeliveryFlowIntegrationTest {

    @Autowired private CheckoutService checkoutService;
    @Autowired private DeliveryService deliveryService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StockRepository stockRepository;
    @Autowired private InventoryReservationRepository reservationRepository;
    @Autowired private ProductOrderRepository orderRepository;
    @Autowired private ServiceOrderRepository serviceOrderRepository;
    @Autowired private OutboxEventRepository outboxEventRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User customer;
    private User deliveryPartner;
    private Store store;
    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        // Clean all dependent tables BEFORE parent tables to respect FK constraints.
        reservationRepository.deleteAll();
        reservationRepository.flush();

        orderRepository.deleteAll();
        orderRepository.flush();

        serviceOrderRepository.deleteAll();
        serviceOrderRepository.flush();

        outboxEventRepository.deleteAll();
        outboxEventRepository.flush();

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

        // 1. Create a customer
        customer = userRepository.save(User.builder()
                .email("test-customer@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Test Customer")
                .phone("9999999999")
                .role(Role.CUSTOMER)
                .build());

        // 2. Create a delivery partner
        deliveryPartner = userRepository.save(User.builder()
                .email("test-delivery@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Test Delivery Rider")
                .phone("7777777777")
                .role(Role.DELIVERY_PARTNER)
                .build());

        // 3. Create a store manager and store
        User manager = userRepository.save(User.builder()
                .email("test-manager@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Test Store Manager")
                .phone("8888888888")
                .role(Role.STORE_MANAGER)
                .build());

        store = storeRepository.save(Store.builder()
                .name("Hyperlocal Plumbing Store")
                .address("123 Main St")
                .latitude(12.9716)
                .longitude(77.5946)
                .manager(manager)
                .build());

        // 4. Create category, product, and stock
        Category category = categoryRepository.save(Category.builder()
                .name("Pipes")
                .build());

        product = productRepository.save(Product.builder()
                .name("PVC Pipe 1 inch")
                .sku("PVC-1INCH")
                .description("Durable PVC pipe")
                .price(new BigDecimal("150.00"))
                .category(category)
                .build());

        stock = stockRepository.save(Stock.builder()
                .store(store)
                .product(product)
                .availableQuantity(50)
                .reservedQuantity(0)
                .build());
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }

    @Test
    void testConfirmPaymentPublishesOutboxEvent() {
        authenticateAs(customer);

        CartItemDTO item = new CartItemDTO(product.getId(), 2);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(item));
        assertEquals(ProductOrderStatus.PENDING, order.getStatus());

        checkoutService.confirmPayment(order.getId());

        ProductOrder confirmedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(ProductOrderStatus.CONFIRMED, confirmedOrder.getStatus());

        List<OutboxEvent> outboxEvents = outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc();
        boolean foundConfirmedEvent = outboxEvents.stream()
                .anyMatch(event -> "order-confirmed".equals(event.getTopic()) &&
                        "ORDER_CONFIRMED".equals(event.getEventType()) &&
                        event.getPayload().contains(String.valueOf(order.getId())));

        assertTrue(foundConfirmedEvent, "Outbox event for order-confirmed was not created.");
    }

    @Test
    void testDeliveryPartnerAcceptsAndOTPConfirm() {
        // 1. Place and confirm order as customer
        authenticateAs(customer);
        CartItemDTO item = new CartItemDTO(product.getId(), 5);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(item));
        checkoutService.confirmPayment(order.getId());

        // 2. Accept order as delivery partner
        authenticateAs(deliveryPartner);
        ProductOrder acceptedOrder = deliveryService.assignDeliveryPartner(order.getId(), deliveryPartner.getId(), "9876");

        assertEquals(ProductOrderStatus.OUT_FOR_DELIVERY, acceptedOrder.getStatus());
        assertEquals("9876", acceptedOrder.getDeliveryOtp());
        assertEquals(deliveryPartner.getId(), acceptedOrder.getDeliveryPartner().getId());

        // Verify outbox contains DELIVERY_ASSIGNED event
        List<OutboxEvent> outboxEvents = outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc();
        boolean foundAssignedEvent = outboxEvents.stream()
                .anyMatch(event -> "delivery-assigned".equals(event.getTopic()) &&
                        "DELIVERY_ASSIGNED".equals(event.getEventType()) &&
                        event.getPayload().contains(String.valueOf(order.getId())) &&
                        event.getPayload().contains("9876"));
        assertTrue(foundAssignedEvent, "Outbox event for delivery-assigned was not created.");

        // 3. Confirm delivery as customer with correct OTP
        authenticateAs(customer);
        ProductOrder deliveredOrder = checkoutService.confirmDelivery(order.getId(), "9876");
        assertEquals(ProductOrderStatus.DELIVERED, deliveredOrder.getStatus());

        // Verify outbox contains ORDER_DELIVERED event
        outboxEvents = outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc();
        boolean foundDeliveredEvent = outboxEvents.stream()
                .anyMatch(event -> "order-delivered".equals(event.getTopic()) &&
                        "ORDER_DELIVERED".equals(event.getEventType()) &&
                        event.getPayload().contains(String.valueOf(order.getId())));
        assertTrue(foundDeliveredEvent, "Outbox event for order-delivered was not created.");
    }

    @Test
    void testConfirmDeliveryWithInvalidOTP() {
        // 1. Place, confirm and assign order
        authenticateAs(customer);
        CartItemDTO item = new CartItemDTO(product.getId(), 1);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(item));
        checkoutService.confirmPayment(order.getId());

        authenticateAs(deliveryPartner);
        deliveryService.assignDeliveryPartner(order.getId(), deliveryPartner.getId(), "4321");

        // 2. Attempt delivery confirmation as customer with incorrect OTP
        authenticateAs(customer);
        assertThrows(IllegalArgumentException.class, () -> {
            checkoutService.confirmDelivery(order.getId(), "0000"); // Wrong OTP
        });

        // Ensure order remains OUT_FOR_DELIVERY
        ProductOrder currentOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(ProductOrderStatus.OUT_FOR_DELIVERY, currentOrder.getStatus());
    }
}
