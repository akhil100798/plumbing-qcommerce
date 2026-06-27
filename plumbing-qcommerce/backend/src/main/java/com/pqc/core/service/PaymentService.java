package com.pqc.core.service;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ServiceOrderRepository orderRepository;
    private final OutboxEventRepository outboxRepository;
    private final PaymentGatewayAdapter paymentGatewayAdapter;

    /**
     * Captures Payment via PaymentGatewayAdapter
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for Order #{} via method {}", 
                request.getOrderId(), request.getPaymentMethodId());

        ServiceOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            return PaymentResponse.builder()
                    .status("FAILED")
                    .message("Order must be in COMPLETED status to accept payment.")
                    .build();
        }

        try {
            String stripeTxId = paymentGatewayAdapter.capturePayment(
                    order.getId(), 
                    order.getTotalAmount(), 
                    request.getPaymentMethodId()
            );

            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);

            // SAVE TO OUTBOX for reliable downstream sync
            outboxRepository.save(com.pqc.core.entity.OutboxEvent.builder()
                    .aggregateId(String.valueOf(order.getId()))
                    .aggregateType("SERVICE_ORDER")
                    .eventType("ORDER_PAID")
                    .topic("order-paid")
                    .payload("ORDER_PAID:" + order.getId() + ":TX:" + stripeTxId)
                    .processed(false)
                    .build());

            log.info("Payment SUCCESS for Order #{}. Transaction ID: {} (Persisted in Outbox)", order.getId(), stripeTxId);

            return PaymentResponse.builder()
                    .transactionId(stripeTxId)
                    .status("SUCCESS")
                    .message("Payment captured successfully via Payment Gateway.")
                    .build();
        } catch (Exception e) {
            log.error("Payment FAILED for Order #{}: {}", order.getId(), e.getMessage());
            return PaymentResponse.builder()
                    .status("FAILED")
                    .message("Gateway rejected transaction: " + e.getMessage())
                    .build();
        }
    }
}
