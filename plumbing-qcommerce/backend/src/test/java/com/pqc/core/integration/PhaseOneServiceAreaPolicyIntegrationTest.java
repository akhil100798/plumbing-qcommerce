package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.LaunchPolicyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class PhaseOneServiceAreaPolicyIntegrationTest {
    @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired UserRepository users; @Autowired LaunchPolicyRepository policies; @Autowired JwtService jwt;
    private User customer;
    @BeforeEach void reset() { jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE"); for (String t : List.of("service_order_assignments","service_order_plumber_dispositions","service_order_status_history","outbox_events","service_orders","launch_policies","plumber_kyc","users")) jdbc.execute("TRUNCATE TABLE " + t + " RESTART IDENTITY"); jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE"); customer=users.save(User.builder().email("area@phase1.test").fullName("Area Customer").phone("9999999999").password("Password123!").role(Role.CUSTOMER).build()); }
    @Test void activeServiceAreaRequiresCoordinates() throws Exception { policies.saveAndFlush(LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY).active(true).currency("INR").serviceAreaCenterLatitude(19.0).serviceAreaCenterLongitude(72.0).serviceAreaRadiusKm(BigDecimal.ONE).build()); mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON).content(base())).andExpect(status().isBadRequest()); }
    @Test void noActiveServiceAreaPreservesLegacyMissingCoordinateBehavior() throws Exception { mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON).content(base())).andExpect(status().isOk()); }
    private String base() { return "{\"issueCategory\":\"pipe\",\"description\":\"Leak\",\"requestType\":\"NEARBY_AUTO\",\"addressLine1\":\"1 Main\",\"city\":\"Mumbai\",\"postalCode\":\"400001\",\"contactPhone\":\"+919876543210\",\"urgency\":\"NORMAL\"}"; }
    private String bearer() { return "Bearer " + jwt.generateToken(customer.getEmail(), customer.getRole().name()); }
}
