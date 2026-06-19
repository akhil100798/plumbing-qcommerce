package com.pqc.core.security;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.Store;
import com.pqc.core.entity.User;
import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.service.PaymentService;
import com.pqc.core.service.ServiceLogService;
import com.pqc.core.service.StoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.pqc.core.service.ServiceOrderService;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResourceAuthorizationTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired StoreRepository stores;
    @Autowired OutboxEventRepository outbox;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired ServiceOrderService orderService;
    @Autowired PaymentService paymentService;
    @Autowired ServiceLogService serviceLogService;
    @Autowired StoreService storeService;

    private User customer;
    private User otherCustomer;
    private User plumber;
    private User otherPlumber;
    private User manager;
    private User admin;
    private ServiceOrder otherCustomersOrder;

    @BeforeEach
    void setUp() {
        outbox.deleteAll();
        orders.deleteAll();
        stores.deleteAll();
        users.deleteAll();

        customer = saveUser("customer@example.com", Role.CUSTOMER);
        otherCustomer = saveUser("other@example.com", Role.CUSTOMER);
        plumber = saveUser("plumber@example.com", Role.PLUMBER);
        otherPlumber = saveUser("other-plumber@example.com", Role.PLUMBER);
        manager = saveUser("manager@example.com", Role.STORE_MANAGER);
        admin = saveUser("admin@example.com", Role.ADMIN);

        otherCustomersOrder = orders.save(ServiceOrder.builder()
                .customer(otherCustomer)
                .description("Private order")
                .customerLatitude(19.07)
                .customerLongitude(72.87)
                .requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.PENDING)
                .build());
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void customerCannotReadAnotherCustomersOrder() throws Exception {
        mvc.perform(get("/api/v1/orders/{id}", otherCustomersOrder.getId())
                .header("Authorization", bearer(customer)))
            .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotAcceptAnOrderForAPlumber() throws Exception {
        mvc.perform(patch("/api/v1/orders/{id}/accept", otherCustomersOrder.getId())
                .param("plumberId", plumber.getId().toString())
                .header("Authorization", bearer(customer)))
            .andExpect(status().isForbidden());
    }

    @Test
    void unassignedPlumberCannotStartAnotherPlumbersOrder() throws Exception {
        otherCustomersOrder.setPlumber(plumber);
        otherCustomersOrder.setStatus(OrderStatus.ACCEPTED);
        orders.save(otherCustomersOrder);

        mvc.perform(patch("/api/v1/orders/{id}/start", otherCustomersOrder.getId())
                .header("Authorization", bearer(otherPlumber)))
            .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotCreateStoreForManager() throws Exception {
        mvc.perform(post("/api/v1/stores")
                .param("managerEmail", manager.getEmail())
                .header("Authorization", bearer(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Unauthorized Store","address":"Mumbai","latitude":19.07,"longitude":72.87}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void storeManagerCannotCreateStoreForAnotherManager() throws Exception {
        mvc.perform(post("/api/v1/stores")
                .param("managerEmail", admin.getEmail())
                .header("Authorization", bearer(manager))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Spoofed Manager Store","address":"Mumbai","latitude":19.07,"longitude":72.87}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotPayAnotherCustomersOrder() throws Exception {
        otherCustomersOrder.setStatus(OrderStatus.COMPLETED);
        orders.save(otherCustomersOrder);

        mvc.perform(post("/api/v1/payments/process")
                .header("Authorization", bearer(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"orderId":%d,"paymentMethodId":"pm_mock","amount":100.00,"currency":"INR"}
                    """.formatted(otherCustomersOrder.getId())))
            .andExpect(status().isForbidden());
    }

    @Test
    void plumberCannotCreateLogForAnotherPlumbersOrder() throws Exception {
        otherCustomersOrder.setPlumber(plumber);
        otherCustomersOrder.setStatus(OrderStatus.IN_PROGRESS);
        orders.save(otherCustomersOrder);

        mvc.perform(post("/api/v1/logs")
                .header("Authorization", bearer(otherPlumber))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"orderId":%d,"plumberId":%d,"diagnosis":"Leak","workDone":"Fixed","notes":"done"}
                    """.formatted(otherCustomersOrder.getId(), plumber.getId())))
            .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotReadAdminMetrics() throws Exception {
        mvc.perform(get("/api/v1/admin/metrics")
                .header("Authorization", bearer(customer)))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminCanReadAdminMetrics() throws Exception {
        mvc.perform(get("/api/v1/admin/metrics")
                .header("Authorization", bearer(admin)))
            .andExpect(status().isOk());
    }

    @Test
    void serviceRejectsCustomerAcceptingForPlumber() {
        authenticate(customer);

        assertThrows(AccessDeniedException.class,
                () -> orderService.acceptOrder(otherCustomersOrder.getId(), plumber.getId()));
    }

    @Test
    void serviceRejectsUnassignedPlumberStartingOrder() {
        otherCustomersOrder.setPlumber(plumber);
        otherCustomersOrder.setStatus(OrderStatus.ACCEPTED);
        orders.save(otherCustomersOrder);
        authenticate(otherPlumber);

        assertThrows(AccessDeniedException.class,
                () -> orderService.startOrder(otherCustomersOrder.getId()));
    }

    @Test
    void serviceRejectsCustomerPayingAnotherCustomersOrder() {
        otherCustomersOrder.setStatus(OrderStatus.COMPLETED);
        orders.save(otherCustomersOrder);
        authenticate(customer);

        PaymentRequest request = PaymentRequest.builder()
                .orderId(otherCustomersOrder.getId())
                .paymentMethodId("pm_mock")
                .amount(BigDecimal.valueOf(100))
                .currency("INR")
                .build();

        assertThrows(AccessDeniedException.class,
                () -> paymentService.processPayment(request));
    }

    @Test
    void serviceRejectsPlumberLoggingAnotherPlumbersOrder() {
        otherCustomersOrder.setPlumber(plumber);
        otherCustomersOrder.setStatus(OrderStatus.IN_PROGRESS);
        orders.save(otherCustomersOrder);
        authenticate(otherPlumber);

        assertThrows(AccessDeniedException.class,
                () -> serviceLogService.createLog(
                        otherCustomersOrder.getId(),
                        otherPlumber.getId(),
                        "Leak",
                        "Fixed",
                        List.of(),
                        "done",
                        null));
    }

    @Test
    void serviceRejectsStoreManagerCreatingStoreForAnotherManager() {
        authenticate(manager);

        Store store = Store.builder()
                .name("Spoofed Store")
                .address("Mumbai")
                .latitude(19.07)
                .longitude(72.87)
                .build();

        assertThrows(AccessDeniedException.class,
                () -> storeService.createStore(store, admin.getEmail()));
    }

    private User saveUser(String email, Role role) {
        return users.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("Password123!"))
                .fullName(role.name())
                .phone("9999999999")
                .role(role)
                .build());
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))));
    }
}
