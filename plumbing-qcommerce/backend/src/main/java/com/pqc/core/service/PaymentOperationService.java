package com.pqc.core.service;

import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.repository.PaymentOperationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentOperationService {
    public static final String PURPOSE = "SERVICE_ORDER_CAPTURE_V1";

    private final PaymentOperationRepository repository;

    public record CaptureClaim(PaymentOperation operation, boolean acquired) {}

    public PaymentOperation getOrCreate(Long orderId, BigDecimal amount, String currency) {
        try {
            return repository.findByServiceOrderIdAndPurpose(orderId, PURPOSE)
                    .orElseGet(() -> createIfAbsent(orderId, amount, currency));
        } catch (DataIntegrityViolationException duplicate) {
            return repository.findByServiceOrderIdAndPurpose(orderId, PURPOSE)
                    .orElseThrow(() -> duplicate);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected PaymentOperation createIfAbsent(Long orderId, BigDecimal amount, String currency) {
        return repository.findByServiceOrderIdAndPurpose(orderId, PURPOSE)
                .orElseGet(() -> repository.saveAndFlush(PaymentOperation.builder()
                        .serviceOrderId(orderId)
                        .purpose(PURPOSE)
                        .idempotencyKey("service-order:" + orderId + ":capture:v1")
                        .status(PaymentOperationStatus.INITIATED)
                        .amount(amount)
                        .currency(currency)
                        .build()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CaptureClaim claimCapture(PaymentOperation operation) {
        PaymentOperation current = repository.findForUpdate(operation.getServiceOrderId(), PURPOSE).orElseThrow();
        if (current.getStatus() == PaymentOperationStatus.INITIATED
                || current.getStatus() == PaymentOperationStatus.FAILED) {
            current.setStatus(PaymentOperationStatus.CAPTURE_IN_PROGRESS);
            current.setFailureReason(null);
            return new CaptureClaim(repository.saveAndFlush(current), true);
        }
        return new CaptureClaim(current, false);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long operationId, String reason) {
        repository.findById(operationId).ifPresent(operation -> {
            operation.setStatus(PaymentOperationStatus.FAILED);
            operation.setFailureReason(reason == null ? "Gateway rejected capture" : reason.substring(0, Math.min(500, reason.length())));
            repository.save(operation);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markReconciliationRequired(Long operationId, String reason) {
        repository.findById(operationId).ifPresent(operation -> {
            operation.setStatus(PaymentOperationStatus.REQUIRES_RECONCILIATION);
            operation.setFailureReason(reason == null ? "Local persistence failed after gateway capture" : reason.substring(0, Math.min(500, reason.length())));
            repository.save(operation);
        });
    }
}
