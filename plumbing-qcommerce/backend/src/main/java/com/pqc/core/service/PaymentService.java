package com.pqc.core.service;

import com.pqc.core.dto.PaymentRequest;
import com.pqc.core.dto.PaymentResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final ServiceOrderRepository orderRepository;
    private final OutboxEventRepository outboxRepository;
    private final CurrentUser currentUser;

    /**
     * MOCK Stripe Payment Processing
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for Order #{} via method {}", 
                request.getOrderId(), request.getPaymentMethodId());

        ServiceOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
        User actor = currentUser.require();
        if (actor.getRole() != Role.CUSTOMER || !order.getCustomer().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Customers may pay only their own orders");
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            return PaymentResponse.builder()
                    .status("FAILED")
                    .message("Order must be in COMPLETED status to accept payment.")
                    .build();
        }

        // --- MOCK STRIPE GATEWAY CALL ---
        // In a real scenario, this is where we'd call Stripe's SDK:
        // PaymentIntent intent = PaymentIntent.create(params);
        boolean externalSuccess = true; 
        String stripeTxId = "tok_mock_" + UUID.randomUUID().toString().substring(0, 8);
        // ---------------------------------

        if (externalSuccess) {
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
                    .message("Payment captured successfully via Stripe.")
                    .build();
        } else {
            log.error("Payment FAILED for Order #{}", order.getId());
            return PaymentResponse.builder()
                    .status("FAILED")
                    .message("Stripe gateway rejected the transaction.")
                    .build();
        }
    }
}
