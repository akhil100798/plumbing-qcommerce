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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhaseOnePolicySnapshotIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired LaunchPolicyRepository policies;
    @Autowired JwtService jwt;
    private User customer;

    @BeforeEach
    void reset() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : List.of("service_order_assignments", "service_order_plumber_dispositions", "service_order_status_history", "outbox_events", "service_orders", "launch_policies", "plumber_kyc", "users")) jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY");
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        customer = users.save(User.builder().email("snapshot@phase1.test").fullName("Snapshot Customer").phone("+911111111111").password("Password123!").role(Role.CUSTOMER).build());
    }

    @Test
    void requestAddressPhoneAndCoordinatesRemainImmutable() throws Exception {
        Long first = create("Old Street", "Old Apt", "Old City", "400001", "Old landmark", "+911111111111", 19.1, 72.1);
        customer.setPhone("+922222222222");
        users.saveAndFlush(customer);
        Long second = create("New Street", "New Apt", "New City", "400002", "New landmark", "+922222222222", 20.2, 73.2);
        ServiceOrder old = orders.findById(first).orElseThrow();
        ServiceOrder newer = orders.findById(second).orElseThrow();
        assertThat(old.getCustomerPhoneSnapshot()).isEqualTo("+911111111111");
        assertThat(old.getAddressLine1()).isEqualTo("Old Street");
        assertThat(old.getAddressLine2()).isEqualTo("Old Apt");
        assertThat(old.getCity()).isEqualTo("Old City");
        assertThat(old.getPostalCode()).isEqualTo("400001");
        assertThat(old.getLandmark()).isEqualTo("Old landmark");
        assertThat(old.getCustomerLatitude()).isEqualTo(19.1);
        assertThat(old.getCustomerLongitude()).isEqualTo(72.1);
        assertThat(newer.getCustomerPhoneSnapshot()).isEqualTo("+922222222222");
        assertThat(newer.getAddressLine1()).isEqualTo("New Street");
        assertThat(newer.getAddressLine2()).isEqualTo("New Apt");
        assertThat(newer.getLandmark()).isEqualTo("New landmark");
        assertThat(newer.getCity()).isEqualTo("New City");
        assertThat(newer.getPostalCode()).isEqualTo("400002");
        assertThat(newer.getCustomerLatitude()).isEqualTo(20.2);
        assertThat(newer.getCustomerLongitude()).isEqualTo(73.2);
    }

    @Test
    void visitFeeAndCurrencyAreSnapshottedPerOrder() throws Exception {
        LaunchPolicy policy = policy(new BigDecimal("100.00"), "INR");
        policies.saveAndFlush(policy);
        Long first = create("One", "Apt", "City", "400001", "L", "+911111111111", null, null);
        policy.setVisitFee(new BigDecimal("250.00"));
        policies.saveAndFlush(policy);
        Long second = create("Two", "Apt", "City", "400002", "L", "+911111111111", null, null);
        assertThat(orders.findById(first).orElseThrow().getVisitFee()).isEqualByComparingTo("100.00");
        assertThat(orders.findById(first).orElseThrow().getCurrency()).isEqualTo("INR");
        assertThat(orders.findById(second).orElseThrow().getVisitFee()).isEqualByComparingTo("250.00");
    }

    @Test
    void snapshotFieldsRemainImmutableAfterCustomerMutation() throws Exception {
        LaunchPolicy policy = policy(new BigDecimal("100.00"), "INR");
        policies.saveAndFlush(policy);
        Long historicalId = create("Original Street", "Original Apt", "Original City", "400001", "Original landmark", "+911111111111", 19.1, 72.1);

        customer.setPhone("+922222222222");
        customer.setFullName("Changed Customer");
        users.saveAndFlush(customer);
        policy.setVisitFee(new BigDecimal("250.00"));
        policy.setCurrency("INR");
        policies.saveAndFlush(policy);

        Long newerId = create("New Street", "New Apt", "New City", "400002", "New landmark", "+922222222222", 20.2, 73.2);
        ServiceOrder historical = orders.findById(historicalId).orElseThrow();
        ServiceOrder newer = orders.findById(newerId).orElseThrow();

        assertThat(historical.getAddressLine1()).isEqualTo("Original Street");
        assertThat(historical.getAddressLine2()).isEqualTo("Original Apt");
        assertThat(historical.getLandmark()).isEqualTo("Original landmark");
        assertThat(historical.getCity()).isEqualTo("Original City");
        assertThat(historical.getPostalCode()).isEqualTo("400001");
        assertThat(historical.getCustomerLatitude()).isEqualTo(19.1);
        assertThat(historical.getCustomerLongitude()).isEqualTo(72.1);
        assertThat(historical.getCustomerPhoneSnapshot()).isEqualTo("+911111111111");
        assertThat(historical.getVisitFee()).isEqualByComparingTo("100.00");
        assertThat(historical.getCurrency()).isEqualTo("INR");

        assertThat(newer.getAddressLine1()).isEqualTo("New Street");
        assertThat(newer.getCustomerPhoneSnapshot()).isEqualTo("+922222222222");
        assertThat(newer.getCustomerLatitude()).isEqualTo(20.2);
        assertThat(newer.getCustomerLongitude()).isEqualTo(73.2);
        assertThat(newer.getVisitFee()).isEqualByComparingTo("250.00");
        assertThat(newer.getCurrency()).isEqualTo("INR");
    }

    private Long create(String address, String address2, String city, String postal, String landmark, String phone, Double lat, Double lon) throws Exception {
        String coordinates = lat == null ? "" : ",\"latitude\":" + lat + ",\"longitude\":" + lon;
        MvcResult result = mvc.perform(post("/api/v1/orders").header("Authorization", bearer()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"issueCategory\":\"pipe\",\"description\":\"Leak\",\"requestType\":\"NEARBY_AUTO\",\"addressLine1\":\"" + address + "\",\"addressLine2\":\"" + address2 + "\",\"city\":\"" + city + "\",\"postalCode\":\"" + postal + "\",\"landmark\":\"" + landmark + "\",\"contactPhone\":\"" + phone + "\",\"urgency\":\"NORMAL\"" + coordinates + "}"))
                .andExpect(status().isOk()).andReturn();
        Number id = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private LaunchPolicy policy(BigDecimal fee, String currency) {
        return LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY).active(true).visitFee(fee).currency(currency).build();
    }

    private String bearer() { return "Bearer " + jwt.generateToken(customer.getEmail(), customer.getRole().name()); }
}
