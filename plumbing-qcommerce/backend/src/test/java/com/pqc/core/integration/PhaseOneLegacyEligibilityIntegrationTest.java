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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class PhaseOneLegacyEligibilityIntegrationTest {
    @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired UserRepository users; @Autowired PlumberKycRepository kyc;
    @Autowired LaunchPolicyRepository policies; @Autowired LaunchPlumberRosterRepository roster; @Autowired JwtService jwt;
    private User customer, eligible, inactive, noKyc, pendingKyc, rejectedKyc, offline, nonRoster, wrongRole;
    private LaunchPolicy policy;

    @BeforeEach
    void reset() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String t : List.of("service_order_assignments","service_order_plumber_dispositions","service_order_status_history","outbox_events","service_orders","launch_plumber_roster","launch_policies","plumber_kyc","users")) jdbc.execute("TRUNCATE TABLE " + t + " RESTART IDENTITY");
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        customer = save("legacy-customer@phase1.test", Role.CUSTOMER, UserStatus.ACTIVE);
        eligible = save("eligible@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        inactive = save("inactive@phase1.test", Role.PLUMBER, UserStatus.SUSPENDED);
        noKyc = save("nokyc@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        pendingKyc = save("pending@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        rejectedKyc = save("rejected@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        offline = save("offline@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        nonRoster = save("nonroster@phase1.test", Role.PLUMBER, UserStatus.ACTIVE);
        wrongRole = save("wrongrole@phase1.test", Role.ADMIN, UserStatus.ACTIVE);
        kyc.save(kyc(eligible, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.ONLINE));
        kyc.save(kyc(inactive, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.ONLINE));
        kyc.save(kyc(pendingKyc, PlumberKycStatus.PENDING, PlumberAvailabilityStatus.ONLINE));
        kyc.save(kyc(rejectedKyc, PlumberKycStatus.REJECTED, PlumberAvailabilityStatus.ONLINE));
        kyc.save(kyc(offline, PlumberKycStatus.APPROVED, PlumberAvailabilityStatus.OFFLINE));
        policy = policies.saveAndFlush(LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY).active(true).currency("INR").rosterEnforcementEnabled(true).build());
        roster.saveAndFlush(LaunchPlumberRoster.builder().policy(policy).plumberId(eligible.getId()).approved(true).build());
    }

    @Test
    void legacyOffersRouteAppliesTheSameEligibilityMatrix() throws Exception {
        Long orderId = createOrder();
        mvc.perform(get("/api/v1/orders/plumber/jobs/offers").header("Authorization", bearer(wrongRole)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/orders/plumber/jobs/offers").header("Authorization", bearer(inactive)))
                .andExpect(status().isUnauthorized());
        assertThat(offers(noKyc)).isEmpty();
        assertThat(offers(pendingKyc)).isEmpty();
        assertThat(offers(rejectedKyc)).isEmpty();
        assertThat(offers(offline)).isEmpty();
        assertThat(offers(nonRoster)).isEmpty();
        assertThat(offers(eligible)).contains(orderId.intValue());
        mvc.perform(patch("/api/v1/orders/{id}/reject", orderId).header("Authorization", bearer(eligible))).andExpect(status().isOk());
        assertThat(offers(eligible)).doesNotContain(orderId.intValue());
        assertThat(offers(nonRoster)).doesNotContain(orderId.intValue());
    }

    private Long createOrder() throws Exception {
        MvcResult r = mvc.perform(post("/api/v1/orders").header("Authorization", bearer(customer)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"issueCategory\":\"pipe\",\"description\":\"Leak\",\"requestType\":\"NEARBY_AUTO\",\"addressLine1\":\"Main\",\"city\":\"Mumbai\",\"postalCode\":\"400001\",\"contactPhone\":\"+919876543210\",\"urgency\":\"NORMAL\"}"))
                .andExpect(status().isOk()).andReturn();
        Number id = com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$.id"); return id.longValue();
    }
    private List<Integer> offers(User user) throws Exception { MvcResult r = mvc.perform(get("/api/v1/orders/plumber/jobs/offers").header("Authorization", bearer(user))).andExpect(status().isOk()).andReturn(); return com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$[*].jobId"); }
    private User save(String email, Role role, UserStatus status) { return users.save(User.builder().email(email).fullName(email).phone("9999999999").password("Password123!").role(role).status(status).build()); }
    private PlumberKyc kyc(User user, PlumberKycStatus status, PlumberAvailabilityStatus availability) { return PlumberKyc.builder().plumberId(user.getId()).status(status).availabilityStatus(availability).build(); }
    private String bearer(User user) { return "Bearer " + jwt.generateToken(user.getEmail(), user.getRole().name()); }
}
