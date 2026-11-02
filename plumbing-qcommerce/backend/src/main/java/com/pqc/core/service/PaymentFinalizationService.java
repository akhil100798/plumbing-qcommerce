package com.pqc.core.service;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.entity.PaymentOperation;
import com.pqc.core.entity.PaymentOperationStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrderStatusHistory;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.PaymentOperationRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.ServiceOrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentFinalizationService {
    private final ServiceOrderRepository orderRepository;
    private final PaymentOperationRepository operationRepository;
    private final OutboxEventRepository outboxRepository;
    private final ServiceOrderStatusHistoryRepository historyRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finalizeCapture(Long operationId, String transactionId) {
        PaymentOperation operation = operationRepository.findById(operationId).orElseThrow();
        if (operation.getStatus() == PaymentOperationStatus.CAPTURED) return;
        if (operation.getStatus() != PaymentOperationStatus.CAPTURE_IN_PROGRESS) {
            throw new IllegalStateException("Payment operation is not capturable: " + operation.getStatus());
        }
        var order = orderRepository.findByIdForUpdate(operation.getServiceOrderId()).orElseThrow();
        operation.setStatus(PaymentOperationStatus.CAPTURED);
        operation.setGatewayTransactionId(transactionId);
        operationRepository.save(operation);

        OrderStatus previousStatus = order.getStatus();
        if (previousStatus != OrderStatus.PAID) {
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            historyRepository.save(ServiceOrderStatusHistory.builder()
                    .serviceOrderId(order.getId())
                    .previousStatus(previousStatus != null ? previousStatus.name() : null)
                    .newStatus(OrderStatus.PAID.name())
                    .actorId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                    .actorRole(Role.CUSTOMER.name())
                    .reason("Payment captured via Payment Gateway: " + transactionId)
                    .build());
        }

        outboxRepository.save(OutboxEvent.builder()
                .aggregateId(String.valueOf(order.getId()))
                .aggregateType("SERVICE_ORDER")
                .eventType("ORDER_PAID")
                .topic("order-paid")
                .payload("ORDER_PAID:" + order.getId() + ":TX:" + transactionId)
                .processed(false)
                .build());
    }
}
