package com.pqc.core.plumbing_core;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.CheckoutService;
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
class CheckoutIntegrationTest {

    @Autowired private CheckoutService checkoutService;
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
    private Store store;
    private Product product;
    private Stock stock;

    @BeforeEach
    void setUp() {
        // Clean all dependent tables BEFORE parent tables to respect FK constraints.
        // Order matters: children (leaf nodes) first, parents last.
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

        // Authenticate the customer in the security context for CheckoutService access checks
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        customer.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + Role.CUSTOMER.name()))));

        // 2. Create a manager and store
        User manager = userRepository.save(User.builder()
                .email("test-manager@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Test Store Manager")
                .phone("8888888888")
                .role(Role.STORE_MANAGER)
                .build());

        store = storeRepository.save(Store.builder()
                .name("Test Store")
                .address("Store Road")
                .latitude(19.0)
                .longitude(72.0)
                .manager(manager)
                .build());

        // 3. Create a product with a fresh category (no unique constraint clash since we cleared all above)
        Category category = categoryRepository.save(Category.builder()
                .name("Pipes")
                .description("Pipes category")
                .build());

        product = productRepository.save(Product.builder()
                .sku("PIPE-1")
                .name("Standard PVC Pipe")
                .description("10ft PVC Pipe")
                .price(new BigDecimal("10.00"))
                .imageUrl("pipe.png")
                .category(category)
                .build());

        // 4. Set stock levels
        stock = stockRepository.save(Stock.builder()
                .store(store)
                .product(product)
                .availableQuantity(50)
                .reservedQuantity(0)
                .build());
    }

    @Test
    void testReserveStockSuccessfully() {
        CartItemDTO cartItem = new CartItemDTO(product.getId(), 5);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(cartItem));

        assertNotNull(order);
        assertEquals(ProductOrderStatus.PENDING, order.getStatus());
        assertEquals(new BigDecimal("50.00"), order.getTotalAmount());

        // Verify stock counts changed correctly
        Stock updatedStock = stockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(45, updatedStock.getAvailableQuantity());
        assertEquals(5, updatedStock.getReservedQuantity());

        // Verify reservation entry was created
        List<InventoryReservation> reservations = reservationRepository.findByOrderId(order.getId());
        assertEquals(1, reservations.size());
        InventoryReservation res = reservations.get(0);
        assertEquals(ReservationStatus.PENDING, res.getStatus());
        assertEquals(5, res.getQuantity());
    }

    @Test
    void testConfirmPaymentReleasesReservedToSold() {
        CartItemDTO cartItem = new CartItemDTO(product.getId(), 5);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(cartItem));

        checkoutService.confirmPayment(order.getId());

        ProductOrder confirmedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(ProductOrderStatus.CONFIRMED, confirmedOrder.getStatus());

        // Verify stock reserved count is decremented while available count remains correct
        Stock updatedStock = stockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(45, updatedStock.getAvailableQuantity());
        assertEquals(0, updatedStock.getReservedQuantity());

        // Verify reservation status is CONFIRMED
        List<InventoryReservation> reservations = reservationRepository.findByOrderId(order.getId());
        assertEquals(ReservationStatus.CONFIRMED, reservations.get(0).getStatus());
    }

    @Test
    void testReleaseReservationRestoresAvailableStock() {
        CartItemDTO cartItem = new CartItemDTO(product.getId(), 5);
        ProductOrder order = checkoutService.reserveStock(customer.getId(), store.getId(), List.of(cartItem));

        checkoutService.releaseReservation(order.getId());

        ProductOrder cancelledOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(ProductOrderStatus.CANCELLED, cancelledOrder.getStatus());

        // Verify stock counts are restored
        Stock updatedStock = stockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(50, updatedStock.getAvailableQuantity());
        assertEquals(0, updatedStock.getReservedQuantity());

        // Verify reservation status is RELEASED
        List<InventoryReservation> reservations = reservationRepository.findByOrderId(order.getId());
        assertEquals(ReservationStatus.RELEASED, reservations.get(0).getStatus());
    }

    @Test
    void testReserveStockThrowsExceptionWhenInsufficient() {
        CartItemDTO cartItem = new CartItemDTO(product.getId(), 51); // 1 more than available 50
        assertThrows(IllegalArgumentException.class, () ->
                checkoutService.reserveStock(customer.getId(), store.getId(), List.of(cartItem))
        );

        // Verify stock counts are unaffected
        Stock updatedStock = stockRepository.findById(stock.getId()).orElseThrow();
        assertEquals(50, updatedStock.getAvailableQuantity());
        assertEquals(0, updatedStock.getReservedQuantity());
    }
}
