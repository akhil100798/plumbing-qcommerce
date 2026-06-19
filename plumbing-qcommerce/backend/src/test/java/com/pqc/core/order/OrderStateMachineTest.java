package com.pqc.core.order;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.StoreRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderStateMachineTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired StoreRepository stores;
    @Autowired OutboxEventRepository outbox;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User customer;
    private User plumber;

    @BeforeEach
    void setUp() {
        outbox.deleteAll();
        orders.deleteAll();
        stores.deleteAll();
        users.deleteAll();

        customer = saveUser("customer-state@example.com", Role.CUSTOMER);
        plumber = saveUser("plumber-state@example.com", Role.PLUMBER);
    }

    @Test
    void createOrderRejectsInvalidTypedPayload() throws Exception {
        mvc.perform(post("/api/v1/orders")
                .header("Authorization", bearer(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"description":"","latitude":91,"longitude":181,"requestType":"NEARBY_AUTO"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors.description").value(containsString("must not be blank")))
            .andExpect(jsonPath("$.fieldErrors.latitude").exists())
            .andExpect(jsonPath("$.fieldErrors.longitude").exists());
    }

    @Test
    void assignedPlumberCannotCompleteWithNegativePartsCharge() throws Exception {
        ServiceOrder order = orders.save(ServiceOrder.builder()
                .customer(customer)
                .plumber(plumber)
                .description("Pipe burst")
                .customerLatitude(19.07)
                .customerLongitude(72.87)
                .requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now().minusMinutes(45))
                .build());

        mvc.perform(patch("/api/v1/orders/{id}/complete", order.getId())
                .header("Authorization", bearer(plumber))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"partsCharge":-1.00}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors.partsCharge").exists());
    }

    @Test
    void ownerCanCancelPendingOrder() throws Exception {
        ServiceOrder order = orders.save(ServiceOrder.builder()
                .customer(customer)
                .description("Cancel me")
                .customerLatitude(19.07)
                .customerLongitude(72.87)
                .requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.PENDING)
                .build());

        mvc.perform(patch("/api/v1/orders/{id}/cancel", order.getId())
                .header("Authorization", bearer(customer)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void completedOrderCannotBeCancelled() throws Exception {
        ServiceOrder order = orders.save(ServiceOrder.builder()
                .customer(customer)
                .plumber(plumber)
                .description("Already done")
                .customerLatitude(19.07)
                .customerLongitude(72.87)
                .requestType(RequestType.NEARBY_AUTO)
                .status(OrderStatus.COMPLETED)
                .partsCharge(BigDecimal.ZERO)
                .build());

        mvc.perform(patch("/api/v1/orders/{id}/cancel", order.getId())
                .header("Authorization", bearer(customer)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("ILLEGAL_ORDER_TRANSITION"));
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
}
