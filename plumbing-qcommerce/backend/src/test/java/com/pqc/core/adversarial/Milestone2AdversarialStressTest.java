package com.pqc.core.adversarial;

import com.pqc.core.controller.PaymentController;
import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.LaunchPolicyService;
import com.pqc.core.service.PaymentGatewayAdapter;
import com.pqc.core.service.PaymentOperationService;
import com.pqc.core.service.PaymentService;
import com.pqc.core.service.RazorpayPaymentGatewayAdapter;
import com.pqc.core.service.notification.TwilioSmsSender;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Empirical Adversarial Challenge & Stress Harness for Milestone 2.
 *
 * Focus areas:
 * 1. Payment Idempotency & Concurrency Race Condition Guards
 * 2. Razorpay Webhook HMAC-SHA256 Signature Verification Strictness
 * 3. Twilio SMS Circuit Breaker Trip & Cooldown Enforcement
 */
@ExtendWith(MockitoExtension.class)
public class Milestone2AdversarialStressTest {

    // =========================================================================
    // 1. PAYMENT IDEMPOTENCY & CONCURRENCY RACE CONDITION GUARDS
    // =========================================================================
    @Nested
    @DisplayName("Challenge 1: Payment Idempotency & Concurrency Race Guards")
    class PaymentIdempotencyConcurrencyChallenge {

        @Mock private PaymentService paymentService;
        @Mock private PaymentOperationService operationService;
        @Mock private ServiceOrderRepository orderRepository;
        @Mock private CurrentUser currentUser;
        @Mock private LaunchPolicyService launchPolicyService;
        @Mock private PaymentGatewayAdapter paymentGatewayAdapter;
        @Mock private RazorpayPaymentGatewayAdapter razorpayAdapter;

        @Test
        @DisplayName("Adversarial: 10 concurrent capture calls with identical idempotency key - exactly 1 capture, no double charge, safe replay")
        void testConcurrentDuplicateCaptures_singleExecution_andSafeReplay() throws Exception {
            PaymentController controller = new PaymentController(
                    paymentService, operationService, orderRepository,
                    currentUser, launchPolicyService, paymentGatewayAdapter, razorpayAdapter
            );

            Long orderId = 100L;
            String idempotencyKey = "idem-stress-race-100";
            PaymentRequest request = PaymentRequest.builder()
                    .orderId(orderId)
                    .amount(new BigDecimal("999.00"))
                    .currency("INR")
                    .build();

            // Track state atomically to simulate database concurrency
            AtomicReference<PaymentOperation> state = new AtomicReference<>(null);
            AtomicInteger actualCaptureCalls = new AtomicInteger(0);

            // Mock operationService.findByOrderId:
            when(operationService.findByOrderId(orderId)).thenAnswer(inv -> Optional.ofNullable(state.get()));

            // Mock operationService.getOrCreate:
            when(operationService.getOrCreate(eq(orderId), any(), any(), eq(idempotencyKey))).thenAnswer(inv -> {
                PaymentOperation op = PaymentOperation.builder()
                        .id(1L)
                        .serviceOrderId(orderId)
                        .idempotencyKey(idempotencyKey)
                        .status(PaymentOperationStatus.INITIATED)
                        .build();
                state.compareAndSet(null, op);
                return state.get();
            });

            // Mock orderRepository for pre-registration
            ServiceOrder mockOrder = ServiceOrder.builder()
                    .id(orderId)
                    .status(OrderStatus.CUSTOMER_CONFIRMED)
                    .totalAmount(new BigDecimal("999.00"))
                    .build();
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(mockOrder));

            // When paymentService.processPayment is called:
            // Simulate that the winner transitions state to CAPTURE_IN_PROGRESS, then sleeps briefly, then CAPTURED
            when(paymentService.processPayment(request)).thenAnswer(inv -> {
                actualCaptureCalls.incrementAndGet();
                PaymentOperation inProgress = PaymentOperation.builder()
                        .id(1L)
                        .serviceOrderId(orderId)
                        .idempotencyKey(idempotencyKey)
                        .status(PaymentOperationStatus.CAPTURE_IN_PROGRESS)
                        .build();
                state.set(inProgress);

                // Small simulated processing latency to widen race window
                Thread.sleep(40);

                PaymentOperation captured = PaymentOperation.builder()
                        .id(1L)
                        .serviceOrderId(orderId)
                        .idempotencyKey(idempotencyKey)
                        .status(PaymentOperationStatus.CAPTURED)
                        .gatewayTransactionId("tx_captured_unique_100")
                        .build();
                state.set(captured);

                return PaymentResponse.builder()
                        .status("SUCCESS")
                        .transactionId("tx_captured_unique_100")
                        .message("Payment captured successfully via Payment Gateway.")
                        .build();
            });

            int threadCount = 10;
            ExecutorService pool = Executors.newFixedThreadPool(threadCount);
            CountDownLatch readyLatch = new CountDownLatch(threadCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            List<Future<ResponseEntity<PaymentResponse>>> futures = new ArrayList<>();

            for (int i = 0; i < threadCount; i++) {
                futures.add(pool.submit(() -> {
                    readyLatch.countDown();
                    startLatch.await(); // Simultaneous firing
                    return controller.processPayment(request, idempotencyKey);
                }));
            }

            readyLatch.await(5, TimeUnit.SECONDS);
            startLatch.countDown(); // Fire!

            List<ResponseEntity<PaymentResponse>> responses = new ArrayList<>();
            for (Future<ResponseEntity<PaymentResponse>> f : futures) {
                responses.add(f.get(10, TimeUnit.SECONDS));
            }
            pool.shutdown();

            // EMPIRICAL VERIFICATION:
            // 1. Exactly 1 actual capture execution occurred at the gateway/service level
            assertThat(actualCaptureCalls.get())
                    .as("Gateway capture must be executed at most once across all concurrent threads")
                    .isEqualTo(1);

            // 2. All responses must be either 200 OK (the winner or replay) or 409 CONFLICT (in-progress collision)
            // NONE can be 500 internal server error or unhandled double capture
            int okCount = 0;
            int conflictCount = 0;
            for (ResponseEntity<PaymentResponse> resp : responses) {
                if (resp.getStatusCode() == HttpStatus.OK) {
                    okCount++;
                    assertThat(resp.getBody()).isNotNull();
                    assertThat(resp.getBody().getStatus()).isEqualTo("SUCCESS");
                    assertThat(resp.getBody().getTransactionId()).isEqualTo("tx_captured_unique_100");
                } else if (resp.getStatusCode() == HttpStatus.CONFLICT) {
                    conflictCount++;
                    assertThat(resp.getBody()).isNotNull();
                    assertThat(resp.getBody().getMessage()).contains("in progress");
                } else {
                    org.junit.jupiter.api.Assertions.fail("Unexpected status code: " + resp.getStatusCode());
                }
            }

            assertThat(okCount).isGreaterThanOrEqualTo(1);
            assertThat(okCount + conflictCount).isEqualTo(threadCount);

            // 3. Subsequent replay test: Now that status is CAPTURED, any subsequent call MUST replay cached record
            ResponseEntity<PaymentResponse> replayResp = controller.processPayment(request, idempotencyKey);
            assertThat(replayResp.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(replayResp.getBody()).isNotNull();
            assertThat(replayResp.getBody().getStatus()).isEqualTo("SUCCESS");
            assertThat(replayResp.getBody().getTransactionId()).isEqualTo("tx_captured_unique_100");

            // Still exactly 1 capture execution call!
            assertThat(actualCaptureCalls.get()).isEqualTo(1);
        }

        @Test
        @DisplayName("Adversarial: Conflicting idempotency key for same order returns HTTP 409 Conflict without executing capture")
        void testConflictingIdempotencyKey_returns409Conflict_andBlocksCapture() {
            PaymentController controller = new PaymentController(
                    paymentService, operationService, orderRepository,
                    currentUser, launchPolicyService, paymentGatewayAdapter, razorpayAdapter
            );

            Long orderId = 200L;
            String originalKey = "original-idem-key-200";
            String conflictingKey = "malicious-tampered-key-999";

            PaymentRequest request = PaymentRequest.builder()
                    .orderId(orderId)
                    .amount(new BigDecimal("750.00"))
                    .currency("INR")
                    .build();

            PaymentOperation existingOp = PaymentOperation.builder()
                    .id(5L)
                    .serviceOrderId(orderId)
                    .idempotencyKey(originalKey)
                    .status(PaymentOperationStatus.INITIATED)
                    .build();

            when(operationService.findByOrderId(orderId)).thenReturn(Optional.of(existingOp));

            ResponseEntity<PaymentResponse> response = controller.processPayment(request, conflictingKey);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getStatus()).isEqualTo("FAILED");
            assertThat(response.getBody().getMessage())
                    .contains("Conflicting idempotency key for order #200");

            // Zero calls to paymentService
            verify(paymentService, never()).processPayment(any());
        }
    }

    // =========================================================================
    // 2. RAZORPAY WEBHOOK SIGNATURE VERIFICATION STRICTNESS
    // =========================================================================
    @Nested
    @DisplayName("Challenge 2: Razorpay Webhook HMAC-SHA256 Signature Verification")
    class RazorpayWebhookSignatureChallenge {

        private final String webhookSecret = "rzp_webhook_secret_adversarial_hardening_key_789";

        private String computeHmacSha256(String data, String secret) throws Exception {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        }

        @Test
        @DisplayName("Adversarial: Valid HMAC-SHA256 signature is accepted by Adapter and Controller")
        void testValidSignature_accepted() throws Exception {
            String rawPayload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test123\",\"amount\":120000}}}}";
            String validSignature = computeHmacSha256(rawPayload, webhookSecret);

            RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_live_key", "rzp_live_secret", webhookSecret);
            boolean adapterResult = adapter.verifyWebhookSignature(rawPayload, validSignature);
            assertThat(adapterResult).isTrue();

            PaymentController controller = new PaymentController(
                    mock(PaymentService.class), mock(PaymentOperationService.class),
                    mock(ServiceOrderRepository.class), mock(CurrentUser.class),
                    mock(LaunchPolicyService.class), mock(PaymentGatewayAdapter.class),
                    adapter
            );
            ReflectionTestUtils.setField(controller, "webhookSecret", webhookSecret);

            ResponseEntity<Map<String, Object>> response = controller.handleWebhook(validSignature, rawPayload);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("status")).isEqualTo("ok");
        }

        @Test
        @DisplayName("Adversarial: Altered payload with authentic signature is strictly REJECTED (400 Bad Request)")
        void testAlteredPayload_tamperDetected_rejected() throws Exception {
            String originalPayload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_orig\",\"amount\":50000}}}}";
            String validSignature = computeHmacSha256(originalPayload, webhookSecret);

            // Tamper: change amount from 50000 to 100000
            String tamperedPayload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_orig\",\"amount\":100000}}}}";

            RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_live_key", "rzp_live_secret", webhookSecret);
            boolean adapterResult = adapter.verifyWebhookSignature(tamperedPayload, validSignature);
            assertThat(adapterResult)
                    .as("Altered payload must fail signature verification")
                    .isFalse();

            PaymentController controller = new PaymentController(
                    mock(PaymentService.class), mock(PaymentOperationService.class),
                    mock(ServiceOrderRepository.class), mock(CurrentUser.class),
                    mock(LaunchPolicyService.class), mock(PaymentGatewayAdapter.class),
                    adapter
            );
            ReflectionTestUtils.setField(controller, "webhookSecret", webhookSecret);

            ResponseEntity<Map<String, Object>> response = controller.handleWebhook(validSignature, tamperedPayload);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().get("status")).isEqualTo("error");
            assertThat(response.getBody().get("message")).isEqualTo("Invalid webhook signature");
        }

        @Test
        @DisplayName("Adversarial: Signature computed with incorrect secret is strictly REJECTED (400 Bad Request)")
        void testInvalidSecretSignature_rejected() throws Exception {
            String rawPayload = "{\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_failed_456\"}}}}";
            String forgedSignature = computeHmacSha256(rawPayload, "attacker_wrong_secret_key");

            RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_live_key", "rzp_live_secret", webhookSecret);
            boolean adapterResult = adapter.verifyWebhookSignature(rawPayload, forgedSignature);
            assertThat(adapterResult).isFalse();

            PaymentController controller = new PaymentController(
                    mock(PaymentService.class), mock(PaymentOperationService.class),
                    mock(ServiceOrderRepository.class), mock(CurrentUser.class),
                    mock(LaunchPolicyService.class), mock(PaymentGatewayAdapter.class),
                    adapter
            );
            ReflectionTestUtils.setField(controller, "webhookSecret", webhookSecret);

            ResponseEntity<Map<String, Object>> response = controller.handleWebhook(forgedSignature, rawPayload);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().get("message")).isEqualTo("Invalid webhook signature");
        }

        @Test
        @DisplayName("Adversarial: Missing or empty signature header is strictly REJECTED with 400 Bad Request")
        void testMissingSignatureHeader_rejected() {
            PaymentController controller = new PaymentController(
                    mock(PaymentService.class), mock(PaymentOperationService.class),
                    mock(ServiceOrderRepository.class), mock(CurrentUser.class),
                    mock(LaunchPolicyService.class), mock(PaymentGatewayAdapter.class),
                    null
            );
            ReflectionTestUtils.setField(controller, "webhookSecret", webhookSecret);

            // Null signature
            ResponseEntity<Map<String, Object>> respNull = controller.handleWebhook(null, "{}");
            assertThat(respNull.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(respNull.getBody().get("message")).isEqualTo("Missing X-Razorpay-Signature header");

            // Empty signature
            ResponseEntity<Map<String, Object>> respEmpty = controller.handleWebhook("   ", "{}");
            assertThat(respEmpty.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(respEmpty.getBody().get("message")).isEqualTo("Missing X-Razorpay-Signature header");
        }

        @Test
        @DisplayName("Adversarial: Null payload or null signature in adapter returns false without NPE")
        void testNullPayloadOrSignature_returnsFalse() {
            RazorpayPaymentGatewayAdapter adapter = new RazorpayPaymentGatewayAdapter("rzp_live_key", "rzp_live_secret", webhookSecret);
            assertThat(adapter.verifyWebhookSignature(null, "some_sig")).isFalse();
            assertThat(adapter.verifyWebhookSignature("{}", null)).isFalse();
            assertThat(adapter.verifyWebhookSignature(null, null)).isFalse();
        }
    }

    // =========================================================================
    // 3. TWILIO SMS CIRCUIT BREAKER TRIP & COOLDOWN
    // =========================================================================
    @Nested
    @DisplayName("Challenge 3: Twilio SMS Circuit Breaker Trip & Cooldown")
    class TwilioCircuitBreakerChallenge {

        @Mock private HttpClient mockHttpClient;
        @Mock private HttpResponse<String> mockHttpResponse;

        @Test
        @DisplayName("Adversarial: 5 consecutive HTTP 500 errors trip circuit breaker open; 6th+ calls skipped")
        void test5ConsecutiveFailures_tripCircuitBreaker_andSkipSubsequentCalls() throws Exception {
            TwilioSmsSender sender = new TwilioSmsSender(
                    mockHttpClient, "AC_real_account_sid_valid", "auth_token_real_valid", "+15559876543"
            );

            when(mockHttpResponse.statusCode()).thenReturn(500);
            doReturn(mockHttpResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

            // 1st through 4th failures: Circuit should remain CLOSED
            for (int i = 1; i <= 4; i++) {
                sender.sendOtp("+919999911111", "12345" + i);
                assertThat(sender.isCircuitOpen())
                        .as("Circuit must remain closed before 5 failures (failure #%d)", i)
                        .isFalse();
                assertThat(sender.getConsecutiveFailures()).isEqualTo(i);
            }
            verify(mockHttpClient, times(4)).send(any(HttpRequest.class), any());

            // 5th failure: Circuit MUST TRIP OPEN
            sender.sendOtp("+919999911111", "123455");
            assertThat(sender.isCircuitOpen())
                    .as("Circuit must TRIP OPEN on 5th consecutive failure")
                    .isTrue();
            assertThat(sender.getConsecutiveFailures()).isEqualTo(5);
            verify(mockHttpClient, times(5)).send(any(HttpRequest.class), any());

            // 6th through 10th calls: All delivery attempts must be SKIPPED without invoking HTTP client
            for (int i = 6; i <= 10; i++) {
                sender.sendOtp("+919999911111", "999999");
                assertThat(sender.isCircuitOpen()).isTrue();
            }

            // HTTP client calls should STILL be exactly 5!
            verify(mockHttpClient, times(5)).send(any(HttpRequest.class), any());
        }

        @Test
        @DisplayName("Adversarial: Cooldown window (60s) expiry transitions circuit breaker to half-open/closed")
        void testCooldownWindow_expiresAndResumesDelivery() throws Exception {
            TwilioSmsSender sender = new TwilioSmsSender(
                    mockHttpClient, "AC_real_account_sid_valid", "auth_token_real_valid", "+15559876543"
            );

            when(mockHttpResponse.statusCode()).thenReturn(503);
            doReturn(mockHttpResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

            // Trip the circuit breaker with 5 failures
            for (int i = 0; i < 5; i++) {
                sender.sendOtp("+919999922222", "11111" + i);
            }
            assertThat(sender.isCircuitOpen()).isTrue();
            verify(mockHttpClient, times(5)).send(any(HttpRequest.class), any());

            // Access the circuitTripTimestamp field via reflection
            AtomicLong tripTime = (AtomicLong) ReflectionTestUtils.getField(sender, "circuitTripTimestamp");
            assertThat(tripTime).isNotNull();

            // Simulate 30 seconds elapsed (less than 60s cooldown): circuit MUST remain open
            tripTime.set(System.currentTimeMillis() - 30_000L);
            assertThat(sender.isCircuitOpen())
                    .as("Circuit must remain open at 30 seconds (< 60s cooldown)")
                    .isTrue();

            // 6th call at 30 seconds still skipped
            sender.sendOtp("+919999922222", "222222");
            verify(mockHttpClient, times(5)).send(any(HttpRequest.class), any());

            // Simulate 61 seconds elapsed (past 60s cooldown): circuit MUST transition to half-open
            tripTime.set(System.currentTimeMillis() - 61_000L);
            assertThat(sender.isCircuitOpen())
                    .as("Circuit must reset to closed/half-open after 60s cooldown expires")
                    .isFalse();
            assertThat(sender.getConsecutiveFailures())
                    .as("Consecutive failures must reset to 0 after cooldown")
                    .isEqualTo(0);

            // Now mock successful response for the recovery call
            when(mockHttpResponse.statusCode()).thenReturn(201);

            // 7th call should now be dispatched to HttpClient!
            sender.sendOtp("+919999922222", "333333");
            verify(mockHttpClient, times(6)).send(any(HttpRequest.class), any());
            assertThat(sender.getConsecutiveFailures()).isEqualTo(0);
            assertThat(sender.isCircuitOpen()).isFalse();
        }

        @Test
        @DisplayName("Adversarial: Network exceptions (IOException, timeout) count toward circuit breaker trip")
        void testNetworkExceptions_tripCircuitBreaker() throws Exception {
            TwilioSmsSender sender = new TwilioSmsSender(
                    mockHttpClient, "AC_real_account_sid_valid", "auth_token_real_valid", "+15559876543"
            );

            when(mockHttpClient.send(any(HttpRequest.class), any()))
                    .thenThrow(new IOException("ConnectException: Connection refused"));

            for (int i = 0; i < 5; i++) {
                sender.sendOtp("+919999933333", "77777" + i);
            }

            assertThat(sender.isCircuitOpen()).isTrue();
            assertThat(sender.getConsecutiveFailures()).isEqualTo(5);

            // Subsequent calls skipped
            sender.sendOtp("+919999933333", "888888");
            verify(mockHttpClient, times(5)).send(any(HttpRequest.class), any());
        }

        @Test
        @DisplayName("Adversarial: Intermittent success resets failure counter preventing false trip")
        void testIntermittentSuccess_resetsFailureCount() throws Exception {
            TwilioSmsSender sender = new TwilioSmsSender(
                    mockHttpClient, "AC_real_account_sid_valid", "auth_token_real_valid", "+15559876543"
            );

            // 4 failures
            when(mockHttpResponse.statusCode()).thenReturn(500);
            doReturn(mockHttpResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

            for (int i = 0; i < 4; i++) {
                sender.sendOtp("+919999944444", "00000" + i);
            }
            assertThat(sender.getConsecutiveFailures()).isEqualTo(4);

            // 1 successful dispatch
            when(mockHttpResponse.statusCode()).thenReturn(200);
            sender.sendOtp("+919999944444", "111111");

            assertThat(sender.getConsecutiveFailures())
                    .as("Successful dispatch must reset consecutive failure count")
                    .isEqualTo(0);
            assertThat(sender.isCircuitOpen()).isFalse();

            // Another 4 failures should still NOT trip the breaker
            when(mockHttpResponse.statusCode()).thenReturn(500);
            for (int i = 0; i < 4; i++) {
                sender.sendOtp("+919999944444", "22222" + i);
            }
            assertThat(sender.getConsecutiveFailures()).isEqualTo(4);
            assertThat(sender.isCircuitOpen()).isFalse();
        }
    }
}
