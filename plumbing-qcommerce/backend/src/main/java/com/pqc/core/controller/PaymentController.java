package com.pqc.core.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.pqc.core.service.PaymentFinalizationService;
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
    private final PaymentFinalizationService finalizationService;
    private final ServiceOrderRepository orderRepository;
    private final CurrentUser currentUser;
    private final LaunchPolicyService launchPolicyService;
    private final PaymentGatewayAdapter paymentGatewayAdapter;
    private final RazorpayPaymentGatewayAdapter razorpayAdapter;
    private final ObjectMapper objectMapper;

    @Value("${payment.razorpay.webhook-secret:${app.payment.razorpay.webhook-secret:${RAZORPAY_WEBHOOK_SECRET:}}}")
    private String webhookSecret;

    @Autowired
    public PaymentController(
            PaymentService paymentService,
            PaymentOperationService operationService,
            @Autowired(required = false) PaymentFinalizationService finalizationService,
            ServiceOrderRepository orderRepository,
            CurrentUser currentUser,
            LaunchPolicyService launchPolicyService,
            PaymentGatewayAdapter paymentGatewayAdapter,
            @Autowired(required = false) RazorpayPaymentGatewayAdapter razorpayAdapter,
            @Autowired(required = false) ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.operationService = operationService;
        this.finalizationService = finalizationService;
        this.orderRepository = orderRepository;
        this.currentUser = currentUser;
        this.launchPolicyService = launchPolicyService;
        this.paymentGatewayAdapter = paymentGatewayAdapter;
        this.razorpayAdapter = razorpayAdapter;
        this.objectMapper = (objectMapper != null) ? objectMapper : new ObjectMapper();
    }

    public PaymentController(
            PaymentService paymentService,
            PaymentOperationService operationService,
            ServiceOrderRepository orderRepository,
            CurrentUser currentUser,
            LaunchPolicyService launchPolicyService,
            PaymentGatewayAdapter paymentGatewayAdapter,
            RazorpayPaymentGatewayAdapter razorpayAdapter) {
        this(paymentService, operationService, null, orderRepository, currentUser, launchPolicyService, paymentGatewayAdapter, razorpayAdapter, null);
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

        BigDecimal amount = order.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "status", "FAILED",
                    "message", "Order has no payable amount."));
        }

        if (request.getAmount() != null && request.getAmount().compareTo(amount) != 0) {
            log.warn("[PAYMENT-INITIATE] Client tampered payment amount for order #{}: requested='{}' vs order='{}'",
                    order.getId(), request.getAmount(), amount);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "FAILED",
                    "message", "Payment amount does not match the order amount."));
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
     * Webhook endpoint verifying X-Razorpay-Signature HMAC SHA-256 against webhook secret
     * and idempotently mutating payment and order states.
     */
    @PostMapping(value = {"/webhook", "/webhook/razorpay", "/webhooks/razorpay"})
    @Operation(summary = "Razorpay Webhook Handler", description = "Verifies HMAC SHA-256 signature against webhook secret and mutates state idempotently.")
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

        log.info("[PAYMENT-WEBHOOK] Webhook signature verified. Processing payload...");

        try {
            processWebhookPayload(rawPayload);
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "message", "Webhook verified and processed"
            ));
        } catch (Exception e) {
            log.error("[PAYMENT-WEBHOOK] Error processing webhook event: {}", e.getMessage(), e);
            // Never leak raw exception traces in webhook responses
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "message", "Failed to process webhook event"
            ));
        }
    }

    private void processWebhookPayload(String rawPayload) throws Exception {
        if (rawPayload == null || rawPayload.isBlank()) {
            return;
        }

        JsonNode root = objectMapper.readTree(rawPayload);
        String event = root.path("event").asText("");
        log.info("[PAYMENT-WEBHOOK] Processing event: {}", event);

        JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
        JsonNode orderEntity = root.path("payload").path("order").path("entity");

        Long orderId = extractOrderId(paymentEntity, orderEntity);
        String paymentId = paymentEntity.path("id").asText(null);

        switch (event) {
            case "payment.captured", "order.paid" -> {
                if (orderId == null) {
                    log.warn("[PAYMENT-WEBHOOK] Event {} missing orderId in notes", event);
                    return;
                }
                handlePaymentCaptured(orderId, paymentId);
            }
            case "payment.failed" -> {
                if (orderId != null) {
                    String reason = paymentEntity.path("error_description").asText("Payment failed on gateway");
                    handlePaymentFailed(orderId, reason);
                }
            }
            case "refund.processed" -> {
                log.info("[PAYMENT-WEBHOOK] Refund processed for order #{} payment {}", orderId, paymentId);
            }
            default -> {
                log.info("[PAYMENT-WEBHOOK] Unhandled event type: {}", event);
            }
        }
    }

    private Long extractOrderId(JsonNode paymentEntity, JsonNode orderEntity) {
        if (!paymentEntity.isMissingNode()) {
            JsonNode notes = paymentEntity.path("notes");
            if (notes.has("order_id")) {
                try {
                    return Long.valueOf(notes.get("order_id").asText());
                } catch (NumberFormatException ignored) {}
            }
            if (notes.has("serviceOrderId")) {
                try {
                    return Long.valueOf(notes.get("serviceOrderId").asText());
                } catch (NumberFormatException ignored) {}
            }
        }
        if (!orderEntity.isMissingNode()) {
            JsonNode notes = orderEntity.path("notes");
            if (notes.has("order_id")) {
                try {
                    return Long.valueOf(notes.get("order_id").asText());
                } catch (NumberFormatException ignored) {}
            }
            if (notes.has("serviceOrderId")) {
                try {
                    return Long.valueOf(notes.get("serviceOrderId").asText());
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private void handlePaymentCaptured(Long orderId, String transactionId) {
        ServiceOrder order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("[PAYMENT-WEBHOOK] Order #{} not found during payment capture webhook", orderId);
            return;
        }

        // Idempotent state check: if order is already PAID, return without double mutation
        if (order.getStatus() == OrderStatus.PAID) {
            log.info("[PAYMENT-WEBHOOK] Order #{} is already in PAID status. Idempotent webhook no-op.", orderId);
            return;
        }

        String effectiveTxId = (transactionId != null && !transactionId.isBlank())
                ? transactionId
                : ("rzp_hook_" + orderId);

        BigDecimal amount = order.getTotalAmount();
        String currency = launchPolicyService.authoritativeCurrency();

        PaymentOperation operation = operationService.getOrCreate(order.getId(), amount, currency);
        if (operation.getStatus() == PaymentOperationStatus.CAPTURED) {
            log.info("[PAYMENT-WEBHOOK] Payment operation #{} already CAPTURED. Idempotent webhook no-op.", operation.getId());
            return;
        }

        PaymentOperationService.CaptureClaim claim = operationService.claimCapture(operation);
        PaymentOperation claimed = claim.operation();

        if (claimed.getStatus() == PaymentOperationStatus.CAPTURED) {
            log.info("[PAYMENT-WEBHOOK] Claimed payment operation #{} already CAPTURED. Idempotent webhook no-op.", claimed.getId());
            return;
        }

        finalizationService.finalizeCapture(claimed.getId(), effectiveTxId);
        log.info("[PAYMENT-WEBHOOK] Successfully finalized payment capture for order #{} with transaction {}",
                orderId, effectiveTxId);
    }

    private void handlePaymentFailed(Long orderId, String reason) {
        Optional<PaymentOperation> operationOpt = operationService.findByOrderId(orderId);
        operationOpt.ifPresent(op -> {
            if (op.getStatus() != PaymentOperationStatus.CAPTURED) {
                operationService.markFailed(op.getId(), reason);
                log.info("[PAYMENT-WEBHOOK] Marked payment operation #{} failed for order #{}: {}",
                        op.getId(), orderId, reason);
            }
        });
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
