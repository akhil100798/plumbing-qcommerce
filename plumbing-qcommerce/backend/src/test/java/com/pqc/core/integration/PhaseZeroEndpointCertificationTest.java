package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.LaunchPolicyService;
import com.pqc.core.service.PaymentGatewayAdapter;
import com.pqc.core.service.PaymentOperationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "app.scheduling.enabled=false"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhaseZeroEndpointCertificationTest {
    private static final double EARTH_RADIUS_KM = 6371.0088;

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired OutboxEventRepository outbox;
    @Autowired PaymentOperationRepository operations;
    @Autowired LaunchPolicyRepository policies;
    @Autowired JwtService jwt;

    @MockitoBean PaymentGatewayAdapter gateway;

    private User customer;
    private String auth;

    @BeforeEach
    void setUp() {
        operations.deleteAll();
        outbox.deleteAll();
        orders.deleteAll();
        policies.deleteAll();
        users.deleteAll();
        customer = users.save(User.builder().fullName("Boundary Customer").email("boundary@pqc.com")
                .password("hashed").phone("9999999999").role(Role.CUSTOMER).build());
        auth = "Bearer " + jwt.generateToken(customer.getEmail(), customer.getRole().name());
    }

    @Test
    void createOrderEnforcesInsideOutsideExactBoundaryAndCoordinateRules() throws Exception {
        double centerLat = 17.385;
        double centerLon = 78.4867;
        double radiusKm = 1.0;
        policies.saveAndFlush(LaunchPolicy.builder().policyKey(LaunchPolicyService.SERVICE_POLICY_KEY)
                .active(true).currency("INR").serviceAreaCenterLatitude(centerLat)
                .serviceAreaCenterLongitude(centerLon).serviceAreaRadiusKm(BigDecimal.valueOf(radiusKm)).build());

        postOrder(centerLat, centerLon + 0.005).andExpect(status().isOk());
        postOrder(centerLat, centerLon + 0.02).andExpect(status().isBadRequest());
        double boundaryLon = centerLon + Math.toDegrees(radiusKm / EARTH_RADIUS_KM)
                / Math.cos(Math.toRadians(centerLat));
        postOrder(centerLat, boundaryLon).andExpect(status().isOk());
        postOrder(null, null).andExpect(status().isBadRequest());

        policies.deleteAll();
        postOrder(null, null).andExpect(status().isOk());
    }

    @Test
    void concurrentPaymentEndpointsCaptureOnceAndPublishOneEvent() throws Exception {
        ServiceOrder order = orders.save(ServiceOrder.builder().customer(customer).description("Concurrent payment")
                .requestType(RequestType.NEARBY_AUTO).totalAmount(new BigDecimal("250.00")).build());
        order.setStatus(OrderStatus.COMPLETED);
        orders.saveAndFlush(order);

        CountDownLatch gatewayEntered = new CountDownLatch(1);
        CountDownLatch releaseGateway = new CountDownLatch(1);
        AtomicInteger captures = new AtomicInteger();
        when(gateway.capturePayment(eq(order.getId()), any(), eq("pm_card"), eq("INR"), anyString()))
                .thenAnswer(invocation -> {
                    captures.incrementAndGet();
                    gatewayEntered.countDown();
                    releaseGateway.await(5, TimeUnit.SECONDS);
                    return "tx-concurrent";
                });

        ExecutorService executor = Executors.newFixedThreadPool(2);
        Callable<Integer> request = () -> mvc.perform(post("/api/v1/payments/process")
                        .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":" + order.getId() + ",\"paymentMethodId\":\"pm_card\",\"amount\":250.00,\"currency\":\"INR\"}"))
                .andReturn().getResponse().getStatus();
        Future<Integer> first = executor.submit(request);
        assertThat(gatewayEntered.await(5, TimeUnit.SECONDS)).isTrue();
        Future<Integer> second = executor.submit(request);
        int secondStatus = second.get(10, TimeUnit.SECONDS);
        releaseGateway.countDown();
        int firstStatus = first.get(10, TimeUnit.SECONDS);
        executor.shutdownNow();

        assertThat(firstStatus).isEqualTo(200);
        assertThat(secondStatus).isEqualTo(400);
        assertThat(captures).hasValue(1);
        assertThat(operations.findByServiceOrderIdAndPurpose(order.getId(), PaymentOperationService.PURPOSE)
                .orElseThrow().getStatus()).isEqualTo(PaymentOperationStatus.CAPTURED);
        assertThat(orders.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(outbox.findByProcessedFalseOrderByCreatedAtAsc()).hasSize(1);
    }

    private org.springframework.test.web.servlet.ResultActions postOrder(Double latitude, Double longitude) throws Exception {
        String lat = latitude == null ? "null" : latitude.toString();
        String lon = longitude == null ? "null" : longitude.toString();
        return mvc.perform(post("/api/v1/orders").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"issueCategory\":\"pipe\",\"description\":\"Boundary request\",\"requestType\":\"NEARBY_AUTO\",\"latitude\":" + lat + ",\"longitude\":" + lon + ",\"addressLine1\":\"1 Main Street\",\"city\":\"Hyderabad\",\"postalCode\":\"500001\",\"contactPhone\":\"+919999999999\",\"urgency\":\"NORMAL\"}"));
    }
}
