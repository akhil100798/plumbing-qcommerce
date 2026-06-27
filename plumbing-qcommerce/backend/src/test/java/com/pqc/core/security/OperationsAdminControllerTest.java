package com.pqc.core.security;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OperationsAdminControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;
    @Autowired StoreRepository storeRepository;
    @Autowired ProductOrderRepository productOrderRepository;
    @Autowired ServiceOrderRepository serviceOrderRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;

    private User superAdmin;
    private User admin;
    private User operationsAdmin;
    private User customer;
    private User plumber;
    private User deliveryPartner;
    private ProductOrder productOrder;
    private ServiceOrder serviceJob;

    @BeforeEach
    void setUp() {
        truncateTables();
        superAdmin = saveUser("super@example.com", Role.SUPER_ADMIN);
        admin = saveUser("admin@example.com", Role.ADMIN);
        operationsAdmin = saveUser("ops@example.com", Role.OPERATIONS_ADMIN);
        customer = saveUser("customer@example.com", Role.CUSTOMER);
        plumber = saveUser("plumber@example.com", Role.PLUMBER);
        deliveryPartner = saveUser("delivery@example.com", Role.DELIVERY_PARTNER);
        User storeManager = saveUser("store@example.com", Role.STORE_MANAGER);
        Store store = storeRepository.save(Store.builder()
                .name("Central Store")
                .address("Mumbai")
                .latitude(19.07)
                .longitude(72.87)
                .manager(storeManager)
                .build());
        productOrder = productOrderRepository.save(ProductOrder.builder()
                .customer(customer)
                .store(store)
                .totalAmount(new BigDecimal("500.00"))
                .status(ProductOrderStatus.CONFIRMED)
                .build());
        serviceJob = serviceOrderRepository.save(ServiceOrder.builder()
                .customer(customer)
                .plumber(plumber)
                .store(store)
                .requestType(RequestType.NEARBY_AUTO)
                .description("Leaking tap")
                .customerLatitude(19.1)
                .customerLongitude(72.9)
                .status(OrderStatus.ACCEPTED)
                .build());
        productOrder.setServiceOrder(serviceJob);
        productOrderRepository.save(productOrder);
    }

    @Test
    void superAdminCanAccessOperationsDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/operations/dashboard").header("Authorization", bearer(superAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeProductOrders").value(1));
    }

    @Test
    void adminCanAccessOperationsDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/operations/dashboard").header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void operationsAdminCanAccessOperationsDashboard() throws Exception {
        mvc.perform(get("/api/v1/admin/operations/dashboard").header("Authorization", bearer(operationsAdmin)))
                .andExpect(status().isOk());
    }

    @Test
    void operationsAdminCanListOperationalResources() throws Exception {
        mvc.perform(get("/api/v1/admin/operations/product-orders").header("Authorization", bearer(operationsAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].orderId").value(productOrder.getId()));
        mvc.perform(get("/api/v1/admin/operations/service-jobs").header("Authorization", bearer(operationsAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].jobId").value(serviceJob.getId()));
        mvc.perform(get("/api/v1/admin/operations/material-requests").header("Authorization", bearer(operationsAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].requestId").value(productOrder.getId()));
    }

    @Test
    void operationsAdminCanReassignPlumberAndDeliveryPartner() throws Exception {
        User newPlumber = saveUser("new-plumber@example.com", Role.PLUMBER);
        User newDelivery = saveUser("new-delivery@example.com", Role.DELIVERY_PARTNER);

        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/reassign-plumber", serviceJob.getId())
                        .header("Authorization", bearer(operationsAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + newPlumber.getId() + ",\"reason\":\"Current plumber unavailable\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plumberName").value(newPlumber.getFullName()));

        mvc.perform(patch("/api/v1/admin/operations/product-orders/{id}/reassign-delivery", productOrder.getId())
                        .header("Authorization", bearer(operationsAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"deliveryPartnerId\":" + newDelivery.getId() + ",\"reason\":\"Original partner delayed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryPartnerName").value(newDelivery.getFullName()));
    }

    @Test
    void cannotCancelDeliveredOrder() throws Exception {
        productOrder.setStatus(ProductOrderStatus.DELIVERED);
        productOrderRepository.save(productOrder);

        mvc.perform(patch("/api/v1/admin/operations/product-orders/{id}/cancel", productOrder.getId())
                        .header("Authorization", bearer(operationsAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Store unable to fulfill\"}"))
                .andExpect(status().isConflict());
    }

    private User saveUser(String email, Role role) {
        return userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("password"))
                .fullName(role.name() + " User")
                .phone("9" + Math.abs(email.hashCode()))
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    private void truncateTables() {
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE inventory_reservations RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_order_items RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE product_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE service_orders RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stocks RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE stores RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE user_addresses RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE wallets RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE notifications RESTART IDENTITY");
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY");
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
    }
}
