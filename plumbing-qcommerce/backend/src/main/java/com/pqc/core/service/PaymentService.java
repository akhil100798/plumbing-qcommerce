package com.pqc.core.service;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final ServiceOrderRepository orderRepository;
    private final PaymentGatewayAdapter paymentGatewayAdapter;
    private final CurrentUser currentUser;
    private final LaunchPolicyService launchPolicyService;
    private final PaymentOperationService operationService;
    private final PaymentFinalizationService finalizationService;

    public PaymentResponse processPayment(PaymentRequest request) {
        ServiceOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        var actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || order.getCustomer() == null
                || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Only the owning customer may pay this order");
        }
        BigDecimal amount = order.getTotalAmount();
        if (amount == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Order has no payable amount");
        String currency = launchPolicyService.authoritativeCurrency();
        if (request.getCurrency() == null || request.getCurrency().isBlank()
                || !request.getCurrency().trim().equalsIgnoreCase(currency)) {
            return failed("Payment currency does not match the order currency.");
        }
        if (request.getAmount() != null && request.getAmount().compareTo(amount) != 0) {
            return failed("Payment amount does not match the order amount.");
        }
        if (order.getStatus() == OrderStatus.PAID) return failed("Order is already paid.");
        if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CUSTOMER_CONFIRMED) {
            return failed("Order must be in COMPLETED or CUSTOMER_CONFIRMED status to accept payment.");
        }

        PaymentOperation operation = operationService.getOrCreate(order.getId(), amount, currency);
        PaymentOperationService.CaptureClaim claim = operationService.claimCapture(operation);
        PaymentOperation claimed = claim.operation();
        if (claimed.getStatus() == PaymentOperationStatus.CAPTURED) return success(claimed.getGatewayTransactionId());
        if (claimed.getStatus() == PaymentOperationStatus.REQUIRES_RECONCILIATION) {
            return failed("Payment requires reconciliation before retry.");
        }
        if (!claim.acquired()) {
            return failed("Payment capture is already in progress.");
        }
        if (claimed.getStatus() != PaymentOperationStatus.CAPTURE_IN_PROGRESS) {
            return failed("Payment operation cannot be retried.");
        }

        final String transactionId;
        try {
            transactionId = paymentGatewayAdapter.capturePayment(order.getId(), amount,
                    request.getPaymentMethodId(), currency, claimed.getIdempotencyKey());
        } catch (Exception gatewayFailure) {
            operationService.markFailed(claimed.getId(), gatewayFailure.getMessage());
            log.warn("Gateway rejected payment operation {} for order {}", claimed.getId(), order.getId(), gatewayFailure);
            return failed("Payment gateway rejected the capture.");
        }
        try {
            finalizationService.finalizeCapture(claimed.getId(), transactionId);
            return success(transactionId);
        } catch (Exception localFailure) {
            operationService.markReconciliationRequired(claimed.getId(), localFailure.getMessage());
            log.error("Payment operation {} requires reconciliation after gateway success", claimed.getId(), localFailure);
            return failed("Payment was accepted by the gateway and requires reconciliation.");
        }
    }

    private PaymentResponse success(String transactionId) {
        return PaymentResponse.builder().transactionId(transactionId).status("SUCCESS")
                .message("Payment captured successfully via Payment Gateway.").build();
    }

    private PaymentResponse failed(String message) {
        return PaymentResponse.builder().status("FAILED").message(message).build();
    }
}
