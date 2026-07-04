package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class StorePartnerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private ProductOrderRepository productOrderRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User admin;
    private User manager1;
    private User manager2;
    private User customer;
    private User rider;
    private Store store1;
    private Store store2;
    private Category category;
    private Product product;

    private String adminToken;
    private String manager1Token;
    private String manager2Token;
    private String customerToken;
    private String riderToken;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE inventory_reservations RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_order_items RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE service_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stocks RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE products RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE categories RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stores RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE user_addresses RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE wallets RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE notifications RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");

        // Seed users
        admin = userRepository.save(User.builder()
                .email("admin@pqc.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Admin")
                .phone("9999999991")
                .role(Role.ADMIN)
                .build());

        manager1 = userRepository.save(User.builder()
                .email("manager1@pqc.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Store Manager 1")
                .phone("9999999992")
                .role(Role.STORE_MANAGER)
                .build());

        manager2 = userRepository.save(User.builder()
                .email("manager2@pqc.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Store Manager 2")
                .phone("9999999993")
                .role(Role.STORE_MANAGER)
                .build());

        customer = userRepository.save(User.builder()
                .email("customer@pqc.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Customer User")
                .phone("9999999994")
                .role(Role.CUSTOMER)
                .build());

        rider = userRepository.save(User.builder()
                .email("rider@pqc.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("Delivery Partner")
                .phone("9999999995")
                .role(Role.DELIVERY_PARTNER)
                .build());

        // Seed stores
        store1 = storeRepository.save(Store.builder()
                .name("Store 1")
                .address("Store 1 Address")
                .latitude(12.9716)
                .longitude(77.5946)
                .manager(manager1)
                .build());

        store2 = storeRepository.save(Store.builder()
                .name("Store 2")
                .address("Store 2 Address")
                .latitude(12.9717)
                .longitude(77.5947)
                .manager(manager2)
                .build());

        // Seed categories & products
        category = categoryRepository.save(Category.builder()
                .name("Plumbing Pipes")
                .description("Pipes category")
                .build());

        product = productRepository.save(Product.builder()
                .name("PVC Pipe")
                .description("High quality PVC pipe")
                .price(new BigDecimal("150.00"))
                .sku("PVC-PIPE-001")
                .category(category)
                .build());

        // Generate tokens
        adminToken = "Bearer " + jwtService.generateToken(admin.getEmail(), admin.getRole().name());
        manager1Token = "Bearer " + jwtService.generateToken(manager1.getEmail(), manager1.getRole().name());
        manager2Token = "Bearer " + jwtService.generateToken(manager2.getEmail(), manager2.getRole().name());
        customerToken = "Bearer " + jwtService.generateToken(customer.getEmail(), customer.getRole().name());
        riderToken = "Bearer " + jwtService.generateToken(rider.getEmail(), rider.getRole().name());
    }

    @Test
    public void testAcceptOrderSuccess() throws Exception {
        // Create an order in CONFIRMED state for store1
        ProductOrder order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        OrderActionRequest request = new OrderActionRequest(store1.getId());

        mockMvc.perform(patch("/api/v1/checkout/orders/" + order.getId() + "/accept")
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PACKING"))
                .andExpect(jsonPath("$.storeId").value(store1.getId()));

        ProductOrder updated = productOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ProductOrderStatus.PACKING);
    }

    @Test
    public void testPackOrderSuccess() throws Exception {
        ProductOrder order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.PACKING)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        PackOrderRequest request = new PackOrderRequest(store1.getId(), "Packed inside waterproof wrap");

        mockMvc.perform(patch("/api/v1/checkout/orders/" + order.getId() + "/pack")
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READY_FOR_PICKUP"));

        ProductOrder updated = productOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ProductOrderStatus.READY_FOR_PICKUP);
    }
    @Test
    public void testStoreManagerListsOwnProductOrdersByStatus() throws Exception {
        ProductOrder store1Order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("150.00"))
                .build());
        productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store2)
                .status(ProductOrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("200.00"))
                .build());

        mockMvc.perform(get("/api/v1/checkout/orders/status/CONFIRMED")
                .header("Authorization", manager1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(store1Order.getId()))
                .andExpect(jsonPath("$[0].storeId").value(store1.getId()))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$[1]").doesNotExist());

        mockMvc.perform(get("/api/v1/checkout/orders/status/CONFIRMED")
                .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$[1].status").value("CONFIRMED"));

        mockMvc.perform(get("/api/v1/checkout/orders/status/CONFIRMED")
                .header("Authorization", customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testHandoverSuccess() throws Exception {
        ProductOrder order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.READY_FOR_PICKUP)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        HandoverRequest request = new HandoverRequest(store1.getId(), rider.getId(), "1234");

        mockMvc.perform(post("/api/v1/checkout/orders/" + order.getId() + "/handover")
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
                .andExpect(jsonPath("$.deliveryPartnerName").value(rider.getFullName()));

        ProductOrder updated = productOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ProductOrderStatus.OUT_FOR_DELIVERY);
        assertThat(updated.getDeliveryPartner().getId()).isEqualTo(rider.getId());
        assertThat(updated.getDeliveryOtp()).isEqualTo("1234");

        // Verify outbox event is created
        assertThat(outboxEventRepository.findAll()).hasSize(1);
    }

    @Test
    public void testInvalidStatusTransitions() throws Exception {
        // 1. Order is PENDING, try to accept it (invalid, must be CONFIRMED)
        ProductOrder pendingOrder = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.PENDING)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        OrderActionRequest acceptRequest = new OrderActionRequest(store1.getId());

        mockMvc.perform(patch("/api/v1/checkout/orders/" + pendingOrder.getId() + "/accept")
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(acceptRequest)))
                .andExpect(status().isBadRequest());

        // 2. Order is CONFIRMED, try to pack it (invalid, must be PACKING)
        ProductOrder confirmedOrder = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        PackOrderRequest packRequest = new PackOrderRequest(store1.getId(), "Pack note");

        mockMvc.perform(patch("/api/v1/checkout/orders/" + confirmedOrder.getId() + "/pack")
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(packRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testUnauthorizedCustomerAccess() throws Exception {
        ProductOrder order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store1)
                .status(ProductOrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("150.00"))
                .build());

        OrderActionRequest request = new OrderActionRequest(store1.getId());

        // CUSTOMER role cannot access accept endpoint
        mockMvc.perform(patch("/api/v1/checkout/orders/" + order.getId() + "/accept")
                .header("Authorization", customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        // Store manager of store 2 cannot manage order of store 1
        mockMvc.perform(patch("/api/v1/checkout/orders/" + order.getId() + "/accept")
                .header("Authorization", manager2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testStockUpdateAndNegativeStockValidation() throws Exception {
        // 1. Success stock update
        StockUpdateRequest updateRequest = new StockUpdateRequest(20);

        mockMvc.perform(put("/api/v1/stores/" + store1.getId() + "/inventory/" + product.getId())
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableQuantity").value(20));

        Stock updatedStock = stockRepository.findByStoreIdAndProductId(store1.getId(), product.getId()).orElseThrow();
        assertThat(updatedStock.getAvailableQuantity()).isEqualTo(20);

        // 2. Reject negative stock in validation
        StockUpdateRequest negativeRequest = new StockUpdateRequest(-5);

        mockMvc.perform(put("/api/v1/stores/" + store1.getId() + "/inventory/" + product.getId())
                .header("Authorization", manager1Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(negativeRequest)))
                .andExpect(status().isBadRequest());

        // 3. Reject other manager accessing store1 inventory
        mockMvc.perform(put("/api/v1/stores/" + store1.getId() + "/inventory/" + product.getId())
                .header("Authorization", manager2Token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());
    }
}
