package com.pqc.core.controller;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.*;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.*;
import com.pqc.core.service.RazorpayPaymentGatewayAdapter.RazorpayCheckoutOrder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private PaymentService paymentService;
    @Mock private PaymentOperationService operationService;
    @Mock private ServiceOrderRepository orderRepository;
    @Mock private CurrentUser currentUser;
    @Mock private LaunchPolicyService launchPolicyService;
    @Mock private PaymentGatewayAdapter paymentGatewayAdapter;
    @Mock private RazorpayPaymentGatewayAdapter razorpayAdapter;

    private PaymentController controller;

    private final String webhookSecret = "test_webhook_secret_key_123";

    @BeforeEach
    void setUp() {
        controller = new PaymentController(
                paymentService,
                operationService,
                orderRepository,
                currentUser,
                launchPolicyService,
                paymentGatewayAdapter,
                razorpayAdapter
        );
        ReflectionTestUtils.setField(controller, "webhookSecret", webhookSecret);
    }

    @Test
    void processPayment_normalSuccess() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId(10L)
                .amount(new BigDecimal("500.00"))
                .currency("INR")
                .paymentMethodId("pm_123")
                .build();

        PaymentResponse successResponse = PaymentResponse.builder()
                .status("SUCCESS")
                .transactionId("tx_abc123")
                .message("Payment captured successfully.")
                .build();

        when(paymentService.processPayment(request)).thenReturn(successResponse);

        ResponseEntity<PaymentResponse> response = controller.processPayment(request, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("SUCCESS");
        assertThat(response.getBody().getTransactionId()).isEqualTo("tx_abc123");
    }

    @Test
    void processPayment_withXIdempotencyKey_idempotentReplayReturnsCachedSuccess() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId(20L)
                .amount(new BigDecimal("350.00"))
                .currency("INR")
                .build();

        PaymentOperation capturedOperation = PaymentOperation.builder()
                .id(1L)
                .serviceOrderId(20L)
                .idempotencyKey("idem-key-20")
                .status(PaymentOperationStatus.CAPTURED)
                .gatewayTransactionId("tx_replayed_999")
                .build();

        when(operationService.findByOrderId(20L)).thenReturn(Optional.of(capturedOperation));

        ResponseEntity<PaymentResponse> response = controller.processPayment(request, "idem-key-20");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("SUCCESS");
        assertThat(response.getBody().getTransactionId()).isEqualTo("tx_replayed_999");
        verify(paymentService, never()).processPayment(any());
    }

    @Test
    void processPayment_withConflictingIdempotencyKey_returns409Conflict() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId(30L)
                .amount(new BigDecimal("400.00"))
                .currency("INR")
                .build();

        PaymentOperation existingOperation = PaymentOperation.builder()
                .id(2L)
                .serviceOrderId(30L)
                .idempotencyKey("original-key-30")
                .status(PaymentOperationStatus.INITIATED)
                .build();

        when(operationService.findByOrderId(30L)).thenReturn(Optional.of(existingOperation));

        ResponseEntity<PaymentResponse> response = controller.processPayment(request, "conflicting-different-key");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo("FAILED");
        assertThat(response.getBody().getMessage()).contains("Conflicting idempotency key");
        verify(paymentService, never()).processPayment(any());
    }

    @Test
    void processPayment_withInProgressCapture_returns409Conflict() {
        PaymentRequest request = PaymentRequest.builder()
                .orderId(40L)
                .amount(new BigDecimal("600.00"))
                .currency("INR")
                .build();

        PaymentOperation inProgressOp = PaymentOperation.builder()
                .id(3L)
                .serviceOrderId(40L)
                .idempotencyKey("idem-40")
                .status(PaymentOperationStatus.CAPTURE_IN_PROGRESS)
                .build();

        when(operationService.findByOrderId(40L)).thenReturn(Optional.of(inProgressOp));

        ResponseEntity<PaymentResponse> response = controller.processPayment(request, "idem-40");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("Payment capture is already in progress");
        verify(paymentService, never()).processPayment(any());
    }

    @Test
    void initiateCheckout_withCompletedOrder_returnsRazorpayCheckoutOrder() {
        User customer = User.builder().id(77L).role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder()
                .id(50L)
                .customer(customer)
                .status(OrderStatus.CUSTOMER_CONFIRMED)
                .totalAmount(new BigDecimal("1200.00"))
                .build();

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(currentUser.require()).thenReturn(User.builder().id(77L).email("cust@fixkart.com").role(Role.CUSTOMER).build());
        when(launchPolicyService.authoritativeCurrency()).thenReturn("INR");

        RazorpayCheckoutOrder expectedCheckout = new RazorpayCheckoutOrder(
                50L, "order_rzp_mock50", new BigDecimal("1200.00"), 120000L, "INR", "rzp_test_key"
        );
        when(razorpayAdapter.createCheckoutOrder(50L, new BigDecimal("1200.00"), "INR")).thenReturn(expectedCheckout);

        PaymentRequest request = PaymentRequest.builder().orderId(50L).build();
        ResponseEntity<?> response = controller.initiateCheckout(request, "idem-initiate-50");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expectedCheckout);
    }

    @Test
    void initiateCheckout_withNonOwningUser_throwsAccessDenied() {
        User customer = User.builder().id(77L).role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder()
                .id(60L)
                .customer(customer)
                .status(OrderStatus.CUSTOMER_CONFIRMED)
                .totalAmount(new BigDecimal("500.00"))
                .build();

        when(orderRepository.findById(60L)).thenReturn(Optional.of(order));
        // Current user is customer #99 (different user)
        when(currentUser.require()).thenReturn(User.builder().id(99L).email("other@fixkart.com").role(Role.CUSTOMER).build());

        PaymentRequest request = PaymentRequest.builder().orderId(60L).build();
        assertThatThrownBy(() -> controller.initiateCheckout(request, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only the owning customer may initiate payment");
    }

    @Test
    void initiateCheckout_withIncompleteOrderStatus_returnsBadRequest() {
        User customer = User.builder().id(77L).role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder()
                .id(70L)
                .customer(customer)
                .status(OrderStatus.IN_PROGRESS) // Not completed yet
                .totalAmount(new BigDecimal("500.00"))
                .build();

        when(orderRepository.findById(70L)).thenReturn(Optional.of(order));
        when(currentUser.require()).thenReturn(User.builder().id(77L).email("cust@fixkart.com").role(Role.CUSTOMER).build());

        PaymentRequest request = PaymentRequest.builder().orderId(70L).build();
        ResponseEntity<?> response = controller.initiateCheckout(request, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertThat(body.get("message")).toString().contains("Order must be in COMPLETED or CUSTOMER_CONFIRMED status");
    }

    @Test
    void webhook_withValidSignature_returns200Ok() {
        String payload = "{\"event\":\"payment.captured\",\"id\":\"pay_123\"}";
        when(razorpayAdapter.verifyWebhookSignature(payload, "valid_sig_header")).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = controller.handleWebhook("valid_sig_header", payload);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("ok");
        assertThat(response.getBody().get("message")).isEqualTo("Webhook verified and processed");
    }

    @Test
    void webhook_withInvalidSignature_returns400BadRequest() {
        String payload = "{\"event\":\"payment.captured\",\"id\":\"pay_123\"}";
        when(razorpayAdapter.verifyWebhookSignature(payload, "invalid_sig_header")).thenReturn(false);

        ResponseEntity<Map<String, Object>> response = controller.handleWebhook("invalid_sig_header", payload);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("error");
        assertThat(response.getBody().get("message")).isEqualTo("Invalid webhook signature");
    }

    @Test
    void webhook_withMissingSignature_returns400BadRequest() {
        String payload = "{\"event\":\"payment.captured\"}";

        ResponseEntity<Map<String, Object>> response = controller.handleWebhook(null, payload);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("message")).isEqualTo("Missing X-Razorpay-Signature header");
    }
}
