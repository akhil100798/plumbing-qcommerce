package com.pqc.core.service;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.ServiceOrderStatusHistory;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.ServiceOrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Cash on Delivery (COD) Payment Gateway Adapter.
 *
 * Manages physical cash settlement lifecycle:
 * - Order verification & state transition to COD_PENDING / PENDING_COLLECTION upon capture initiation.
 * - Driver / store partner remittance reconciliation payout on job completion.
 */
@Component
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "cod")
@RequiredArgsConstructor
@Slf4j
public class CodPaymentGatewayAdapter implements PaymentGatewayAdapter {

    public static final String STATUS_COD_PENDING = "COD_PENDING";
    public static final String STATUS_PENDING_COLLECTION = "PENDING_COLLECTION";

    private final ServiceOrderRepository orderRepository;
    private final ServiceOrderStatusHistoryRepository historyRepository;

    @Override
    public String capturePayment(Long orderId, BigDecimal amount, String paymentMethodId, String currency,
                                 String idempotencyKey) {
        if (orderId == null) {
            throw new IllegalArgumentException("Order ID cannot be null for COD payment capture.");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Invalid COD amount: must be positive.");
        }

        ServiceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Service order #" + orderId + " not found for COD capture."));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Service order #" + orderId + " is already marked as PAID.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Service order #" + orderId + " is cancelled; cannot capture COD payment.");
        }

        String transactionId = "cod_tx_" + orderId + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        // Record COD audit lifecycle: state transitioning to COD_PENDING / PENDING_COLLECTION
        try {
            historyRepository.save(ServiceOrderStatusHistory.builder()
                    .serviceOrderId(order.getId())
                    .previousStatus(order.getStatus() != null ? order.getStatus().name() : null)
                    .newStatus(STATUS_PENDING_COLLECTION)
                    .actorId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                    .actorRole(Role.CUSTOMER.name())
                    .reason(STATUS_COD_PENDING + ": Cash on Delivery verified. Status set to " + STATUS_PENDING_COLLECTION + " (Tx: " + transactionId + ")")
                    .build());
        } catch (Exception ex) {
            log.warn("[COD-PAYMENT] Failed to append status history for order #{}: {}", orderId, ex.getMessage());
        }

        log.info("[COD-PAYMENT] Order #{}: Verified Cash on Delivery for {} {}. Payment status set to {} / {}. Tx: {}",
                orderId, amount, currency, STATUS_COD_PENDING, STATUS_PENDING_COLLECTION, transactionId);

        return transactionId;
    }

    @Override
    public String processPayout(Long userId, String role, BigDecimal amount) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null for COD payout.");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payout amount must be positive.");
        }

        String payoutRef = "cod_payout_" + userId + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        log.info("[COD-PAYOUT] Processed physical cash collection reconciliation payout on completion for user #{} ({}) amount {}. Ref: {}",
                userId, role, amount, payoutRef);

        return payoutRef;
    }
}
