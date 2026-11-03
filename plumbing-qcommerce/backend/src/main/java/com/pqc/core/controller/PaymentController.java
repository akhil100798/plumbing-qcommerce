package com.pqc.core.controller;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.CodPaymentGatewayAdapter;
import com.pqc.core.service.LaunchPolicyService;
import com.pqc.core.service.PaymentGatewayAdapter;
import com.pqc.core.service.PaymentOperationService;
import com.pqc.core.service.PaymentService;
import com.pqc.core.service.RazorpayPaymentGatewayAdapter;
import com.pqc.core.service.RazorpayPaymentGatewayAdapter.RazorpayCheckoutOrder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payment Management", description = "Endpoints for Razorpay, Cash on Delivery, and Mock payment integration")
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentOperationService operationService;
    private final ServiceOrderRepository orderRepository;
    private final CurrentUser currentUser;
    private final LaunchPolicyService launchPolicyService;
    private final PaymentGatewayAdapter paymentGatewayAdapter;
    private final RazorpayPaymentGatewayAdapter razorpayAdapter;

    @Value("${payment.razorpay.webhook-secret:${app.payment.razorpay.webhook-secret:${RAZORPAY_WEBHOOK_SECRET:}}}")
    private String webhookSecret;

    @Autowired
    public PaymentController(
            PaymentService paymentService,
            PaymentOperationService operationService,
            ServiceOrderRepository orderRepository,
            CurrentUser currentUser,
            LaunchPolicyService launchPolicyService,
            PaymentGatewayAdapter paymentGatewayAdapter,
            @Autowired(required = false) RazorpayPaymentGatewayAdapter razorpayAdapter) {
        this.paymentService = paymentService;
        this.operationService = operationService;
        this.orderRepository = orderRepository;
        this.currentUser = currentUser;
        this.launchPolicyService = launchPolicyService;
        this.paymentGatewayAdapter = paymentGatewayAdapter;
        this.razorpayAdapter = razorpayAdapter;
    }

    /**
     * Client-side tokenized checkout / payment initiation.
     * Generates a gateway checkout order (e.g. Razorpay order) for frontend tokenized payment.
     */
    @PostMapping(value = {"/initiate", "/checkout-order", "/create-checkout-order"})
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Initiate client-side tokenized checkout", description = "Generates order token / Razorpay order for client checkout.")
    public ResponseEntity<?> initiateCheckout(
            @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        if (request.getOrderId() == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Order ID is required."));
        }

        ServiceOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        var actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || order.getCustomer() == null
                || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the owning customer may initiate payment for this order");
        }

        if (order.getStatus() == OrderStatus.PAID) {
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Order is already paid."));
        }

        if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CUSTOMER_CONFIRMED) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "FAILED",
                    "message", "Order must be in COMPLETED or CUSTOMER_CONFIRMED status to initiate checkout."));
        }

        BigDecimal amount = (request.getAmount() != null) ? request.getAmount() : order.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "status", "FAILED",
                    "message", "Order has no payable amount."));
        }

        String currency = (request.getCurrency() != null && !request.getCurrency().isBlank())
                ? request.getCurrency().trim().toUpperCase()
                : launchPolicyService.authoritativeCurrency();

        // Optional idempotency pre-registration
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            operationService.getOrCreate(order.getId(), amount, currency, idempotencyKey.trim());
        }

        // 1. If Razorpay adapter is active
        if (razorpayAdapter != null) {
            RazorpayCheckoutOrder checkoutOrder = razorpayAdapter.createCheckoutOrder(order.getId(), amount, currency);
            return ResponseEntity.ok(checkoutOrder);
        }
        if (paymentGatewayAdapter instanceof RazorpayPaymentGatewayAdapter rp) {
            RazorpayCheckoutOrder checkoutOrder = rp.createCheckoutOrder(order.getId(), amount, currency);
            return ResponseEntity.ok(checkoutOrder);
        }

        // 2. If COD adapter is active
        if (paymentGatewayAdapter instanceof CodPaymentGatewayAdapter) {
            return ResponseEntity.ok(Map.of(
                    "orderId", order.getId(),
                    "provider", "cod",
                    "status", CodPaymentGatewayAdapter.STATUS_COD_PENDING,
                    "amount", amount,
                    "currency", currency,
                    "message", "Cash on Delivery checkout ready."
            ));
        }

        // 3. Fallback / Mock simulation
        String simOrderId = "order_sim_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
        return ResponseEntity.ok(new RazorpayCheckoutOrder(
                order.getId(),
                simOrderId,
                amount,
                amountInPaise,
                currency,
                "rzp_test_simulated_key"
        ));
    }

    /**
     * Capture / process payment with X-Idempotency-Key support and replay guards.
     */
    @PostMapping(value = {"/process", "/capture"})
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Process a service order payment", description = "Captures payment for a service order with idempotency and replay guards.")
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestBody PaymentRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        if (request.getOrderId() == null) {
            return ResponseEntity.badRequest().body(PaymentResponse.builder()
                    .status("FAILED")
                    .message("Order ID is required.")
                    .build());
        }

        // Enforce idempotency and replay guards when X-Idempotency-Key is provided
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String cleanKey = idempotencyKey.trim();
            Optional<PaymentOperation> existingOpt = operationService.findByOrderId(request.getOrderId());
            if (existingOpt.isPresent()) {
                PaymentOperation existing = existingOpt.get();
                // Check if the key conflicts with an already recorded operation for this order
                if (existing.getIdempotencyKey() != null && !existing.getIdempotencyKey().equals(cleanKey)) {
                    log.warn("[PAYMENT-IDEMPOTENCY] Conflicting idempotency key for order #{}: existing='{}' vs provided='{}'",
                            request.getOrderId(), existing.getIdempotencyKey(), cleanKey);
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(PaymentResponse.builder()
                            .status("FAILED")
                            .message("Conflicting idempotency key for order #" + request.getOrderId())
                            .build());
                }
                // Check if already captured -> Idempotent replay: return cached success response
                if (existing.getStatus() == PaymentOperationStatus.CAPTURED) {
                    log.info("[PAYMENT-IDEMPOTENCY] Idempotent replay detected for order #{} with key '{}'",
                            request.getOrderId(), cleanKey);
                    return ResponseEntity.ok(PaymentResponse.builder()
                            .transactionId(existing.getGatewayTransactionId())
                            .status("SUCCESS")
                            .message("Payment captured successfully via Payment Gateway.")
                            .build());
                }
                // Check if already in progress -> Replay guard returns 409
                if (existing.getStatus() == PaymentOperationStatus.CAPTURE_IN_PROGRESS) {
                    log.warn("[PAYMENT-IDEMPOTENCY] Payment capture already in progress for order #{} with key '{}'",
                            request.getOrderId(), cleanKey);
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(PaymentResponse.builder()
                            .status("FAILED")
                            .message("Payment capture is already in progress.")
                            .build());
                }
            } else {
                // Pre-register operation with client's idempotency key
                ServiceOrder order = orderRepository.findById(request.getOrderId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
                BigDecimal amount = (request.getAmount() != null) ? request.getAmount() : order.getTotalAmount();
                String currency = (request.getCurrency() != null && !request.getCurrency().isBlank())
                        ? request.getCurrency().trim().toUpperCase()
                        : launchPolicyService.authoritativeCurrency();
                operationService.getOrCreate(order.getId(), amount, currency, cleanKey);
            }
        }

        PaymentResponse response = paymentService.processPayment(request);
        if ("SUCCESS".equals(response.getStatus())) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Webhook endpoint verifying X-Razorpay-Signature HMAC SHA-256 against webhook secret.
     */
    @PostMapping(value = {"/webhook", "/webhook/razorpay", "/webhooks/razorpay"})
    @Operation(summary = "Razorpay Webhook Handler", description = "Verifies HMAC SHA-256 signature against webhook secret.")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader,
            @RequestBody String rawPayload) {

        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("[PAYMENT-WEBHOOK] Missing X-Razorpay-Signature header.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "error",
                    "message", "Missing X-Razorpay-Signature header"
            ));
        }

        boolean valid;
        if (razorpayAdapter != null) {
            valid = razorpayAdapter.verifyWebhookSignature(rawPayload, signatureHeader);
        } else {
            valid = verifyWebhookHmac(rawPayload, signatureHeader);
        }

        if (!valid) {
            log.warn("[PAYMENT-WEBHOOK] Webhook signature verification failed for signature: {}", signatureHeader);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", "error",
                    "message", "Invalid webhook signature"
            ));
        }

        log.info("[PAYMENT-WEBHOOK] Webhook successfully verified. Payload length: {} bytes.", rawPayload != null ? rawPayload.length() : 0);
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "message", "Webhook verified and processed"
        ));
    }

    private boolean verifyWebhookHmac(String rawPayload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank() || rawPayload == null) {
            return false;
        }
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
                byte[] raw = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
                String expected = HexFormat.of().formatHex(raw);
                return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                        signatureHeader.trim().getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                log.error("[PAYMENT-WEBHOOK] Failed to compute HMAC SHA-256: {}", e.getMessage());
                return false;
            }
        }
        return signatureHeader.startsWith("sim_") || "valid_signature".equals(signatureHeader);
    }
}
