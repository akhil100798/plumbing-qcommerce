package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhaseOneRequestValidationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired JwtService jwt;
    private User customer;

    @BeforeEach
    void reset() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : List.of("service_order_assignments", "service_order_plumber_dispositions", "service_order_status_history", "outbox_events", "service_orders", "plumber_kyc", "users")) {
            jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY");
        }
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        customer = users.save(User.builder().email("validation@phase1.test").fullName("Validation Customer")
                .phone("9999999999").password("Password123!").role(Role.CUSTOMER).build());
    }

    @Test
    void invalidRequestFieldsAreRejectedAtHttpBoundary() throws Exception {
        assertBad(base().replace("\"pipe\"", "\"invalid\""));
        assertBad(base().replace("\"NORMAL\"", "\"INVALID\""));
        assertBad(base().replace("\"Leak\"", "\"   \""));
        assertBad(base().replace("1 Main Street", ""));
        assertBad(base().replace("Mumbai", ""));
        assertBad(base().replace("400001", "12"));
        assertBad(base().replace("+919876543210", "bad-phone"));
        assertBad(base().replace("\"+919876543210\"", "\"+919876543210\",\"latitude\":91"));
        assertBad(base().replace("\"+919876543210\"", "\"+919876543210\",\"longitude\":181"));
        assertBad(base().replace("\"urgency\":\"NORMAL\"", "\"urgency\":\"NORMAL\",\"scheduledFor\":\"2000-01-01T00:00:00\""));
    }

    @Test
    void nowAndFutureScheduledRequestsPersistExactLocalDateTime() throws Exception {
        String future = LocalDateTime.now(ZoneOffset.UTC).plusDays(2).withNano(0).toString();
        mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                        .content(base().replace("\"urgency\":\"NORMAL\"", "\"urgency\":\"NORMAL\",\"scheduledFor\":\"" + future + "\"")))
                .andExpect(status().isOk());
        assertThat(orders.findAll()).singleElement().extracting(ServiceOrder::getScheduledFor).isEqualTo(LocalDateTime.parse(future));

        mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON).content(base()))
                .andExpect(status().isOk());
        assertThat(orders.findAll()).anyMatch(order -> order.getScheduledFor() == null);
    }

    private void assertBad(String body) throws Exception {
        mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    private String base() {
        return "{\"issueCategory\":\"pipe\",\"description\":\"Leak\",\"requestType\":\"NEARBY_AUTO\",\"addressLine1\":\"1 Main Street\",\"city\":\"Mumbai\",\"postalCode\":\"400001\",\"contactPhone\":\"+919876543210\",\"urgency\":\"NORMAL\"}";
    }

    private String bearer() { return "Bearer " + jwt.generateToken(customer.getEmail(), customer.getRole().name()); }
}
