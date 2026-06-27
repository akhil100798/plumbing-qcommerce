package com.pqc.core.integration;

import com.pqc.core.controller.DeliveryController;
import com.pqc.core.document.AuditLogEvent;
import com.pqc.core.document.AuditLogEventRepository;
import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.scheduler.OutboxPoller;
import com.pqc.core.service.PaymentService;
import com.pqc.core.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.task.scheduling.enabled=false",
        "app.scheduling.enabled=false"
})
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SecurityAndHardeningIntegrationTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    StoreRepository storeRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    StockRepository stockRepository;

    @Autowired
    ProductOrderRepository productOrderRepository;

    @Autowired
    ServiceOrderRepository serviceOrderRepository;

    @Autowired
    OutboxEventRepository outboxEventRepository;

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @MockitoBean
    AuditLogEventRepository auditLogEventRepository;

    @Autowired
    RefreshTokenService refreshTokenService;

    @Autowired
    PaymentService paymentService;

    @Autowired
    DeliveryController deliveryController;

    @Autowired
    OutboxPoller outboxPoller;

    private User customer1;
    private User customer2;
    private Store store;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.reset(auditLogEventRepository);

        refreshTokenRepository.deleteAll();
        refreshTokenRepository.flush();

        productOrderRepository.deleteAll();
        productOrderRepository.flush();

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

        customer1 = userRepository.save(User.builder()
                .fullName("Customer One")
                .email("customer1@pqc.com")
                .password("hashed")
                .phone("1111111111")
                .role(Role.CUSTOMER)
                .build());

        customer2 = userRepository.save(User.builder()
                .fullName("Customer Two")
                .email("customer2@pqc.com")
                .password("hashed")
                .phone("2222222222")
                .role(Role.CUSTOMER)
                .build());

        User manager = userRepository.save(User.builder()
                .fullName("Manager")
                .email("manager@pqc.com")
                .password("hashed")
                .phone("3333333333")
                .role(Role.STORE_MANAGER)
                .build());

        store = storeRepository.save(Store.builder()
                .name("Test Store")
                .address("Store St")
                .latitude(1.0)
                .longitude(1.0)
                .manager(manager)
                .build());
    }

    @Test
    void testRefreshTokenLifecycleAndRotation() {
        RefreshToken firstToken = refreshTokenService.createRefreshToken(customer1);
        assertThat(firstToken.getToken()).isNotNull();
        assertThat(firstToken.getUser().getId()).isEqualTo(customer1.getId());

        RefreshToken rotatedToken = refreshTokenService.rotateToken(firstToken.getToken());
        assertThat(rotatedToken.getToken()).isNotEqualTo(firstToken.getToken());
        assertThat(rotatedToken.getUser().getId()).isEqualTo(customer1.getId());

        assertThatThrownBy(() -> refreshTokenService.findByToken(firstToken.getToken()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void givenProductOrder_whenUnauthorisedCustomerConfirmsOtp_thenThrowsAccessDenied() {
        ProductOrder order = productOrderRepository.save(ProductOrder.builder()
                .customer(customer1)
                .store(store)
                .status(ProductOrderStatus.OUT_FOR_DELIVERY)
                .deliveryOtp("9999")
                .totalAmount(new BigDecimal("100.00"))
                .build());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        customer2.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + Role.CUSTOMER.name()))));

        assertThatThrownBy(() -> deliveryController.confirmDelivery(order.getId(), null, "9999"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not own this order.");
    }

    @Test
    void testPluggableGatewayCaptureAndFailure() {
        ServiceOrder order = serviceOrderRepository.saveAndFlush(ServiceOrder.builder()
                .customer(customer1)
                .description("Service Job")
                .requestType(RequestType.NEARBY_AUTO)
                .laborCharge(new BigDecimal("200.00"))
                .partsCharge(new BigDecimal("0.00"))
                .platformFee(new BigDecimal("50.00"))
                .totalAmount(new BigDecimal("250.00"))
                .build());

        order.setStatus(OrderStatus.COMPLETED);
        order = serviceOrderRepository.saveAndFlush(order);

        PaymentRequest successRequest = new PaymentRequest(order.getId(), "pm_card_visa", order.getTotalAmount(), "INR");
        PaymentResponse response = paymentService.processPayment(successRequest);
        assertThat(response.getStatus()).isEqualTo("SUCCESS");
        assertThat(response.getTransactionId()).startsWith("ch_mock_");

        ServiceOrder paidOrder = serviceOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(paidOrder.getStatus()).isEqualTo(OrderStatus.PAID);

        paidOrder.setStatus(OrderStatus.COMPLETED);
        serviceOrderRepository.saveAndFlush(paidOrder);

        PaymentRequest failRequest = new PaymentRequest(order.getId(), "pm_instrument_fail", order.getTotalAmount(), "INR");
        PaymentResponse failResponse = paymentService.processPayment(failRequest);
        assertThat(failResponse.getStatus()).isEqualTo("FAILED");
        assertThat(failResponse.getMessage()).contains("MockPaymentGateway: payment capture failed");
    }

    @Test
    void testOutboxPollerPersistsLogsToMongoDB() {
        OutboxEvent event = outboxEventRepository.save(OutboxEvent.builder()
                .aggregateId("99")
                .aggregateType("PRODUCT_ORDER")
                .eventType("ORDER_PLACED")
                .topic("order-placed")
                .payload("{\"orderId\":99}")
                .processed(false)
                .build());

        outboxPoller.pollAndPublish();
        outboxPoller.pollAndPublish();

        OutboxEvent processed = outboxEventRepository.findById(event.getId()).orElseThrow();
        assertThat(processed.isProcessed()).isTrue();
        assertThat(outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc()).isEmpty();

        org.mockito.ArgumentCaptor<AuditLogEvent> captor = org.mockito.ArgumentCaptor.forClass(AuditLogEvent.class);
        org.mockito.Mockito.verify(auditLogEventRepository, org.mockito.Mockito.times(1)).save(captor.capture());

        AuditLogEvent saved = captor.getValue();
        assertThat(saved.getAggregateId()).isEqualTo("99");
        assertThat(saved.getEventType()).isEqualTo("ORDER_PLACED");
        assertThat(saved.getPayload()).isEqualTo("{\"orderId\":99}");
    }
}
