package com.pqc.core.service;

import com.pqc.core.entity.*;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final ProductOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OutboxEventRepository outboxRepository;
    private final CurrentUser currentUser;
    private final DeliveryOtpService deliveryOtpService;

    /**
     * Assigns a delivery partner to an order and updates status to OUT_FOR_DELIVERY.
     */
    @Transactional
    public ProductOrder assignDeliveryPartner(Long orderId, Long partnerId, String otp) {
        User actor = currentUser.require();
        if (actor.getRole() != Role.DELIVERY_PARTNER || !actor.getId().equals(partnerId)) {
            throw new AccessDeniedException("Delivery partners may only accept assignments for themselves.");
        }

        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getStatus() != ProductOrderStatus.CONFIRMED) {
            throw new IllegalStateException("Order #" + orderId + " is not ready for delivery assignment (current status: " + order.getStatus() + ")");
        }

        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found: " + partnerId));

        if (partner.getRole() != Role.DELIVERY_PARTNER) {
            throw new IllegalArgumentException("User " + partnerId + " is not a delivery partner.");
        }

        order.setDeliveryPartner(partner);
        
        if (otp == null || otp.trim().isEmpty()) {
            otp = deliveryOtpService.generateOtp(order.getId(), partner.getId());
        } else {
            deliveryOtpService.saveExplicitOtp(order.getId(), partner.getId(), otp);
        }
        
        order.setDeliveryOtp(otp);
        order.setEstimatedDeliveryAt(LocalDateTime.now().plusMinutes(30));
        order.setStatus(ProductOrderStatus.OUT_FOR_DELIVERY);

        ProductOrder savedOrder = orderRepository.save(order);

        // Save to Outbox for Live WebSocket tracking in Edge Service (OTP redacted for security)
        String payload = "{" +
                "\"orderId\":" + savedOrder.getId() + "," +
                "\"deliveryPartnerId\":" + partnerId + "," +
                "\"deliveryPartnerName\":\"" + partner.getFullName() + "\"," +
                "\"deliveryOtp\":\"[REDACTED]\"," +
                "\"customerId\":" + savedOrder.getCustomer().getId() +
                "}";

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateId(String.valueOf(savedOrder.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType("DELIVERY_ASSIGNED")
                .topic("delivery-assigned")
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(outboxEvent);

        log.info("Order #{} assigned to delivery partner #{}.", orderId, partnerId);
        return savedOrder;
    }

    /**
     * Force assigns a delivery partner by a Store Manager or Admin.
     */
    @Transactional
    public ProductOrder forceAssignDeliveryPartner(Long orderId, Long partnerId) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found: " + partnerId));

        if (partner.getRole() != Role.DELIVERY_PARTNER) {
            throw new IllegalArgumentException("User " + partnerId + " is not a delivery partner.");
        }

        order.setDeliveryPartner(partner);
        String otp = deliveryOtpService.generateOtp(order.getId(), partner.getId());
        order.setDeliveryOtp(otp);
        order.setEstimatedDeliveryAt(LocalDateTime.now().plusMinutes(30));
        order.setStatus(ProductOrderStatus.OUT_FOR_DELIVERY);

        ProductOrder savedOrder = orderRepository.save(order);

        // Save to Outbox for Live WebSocket tracking in Edge Service
        String payload = "{" +
                "\"orderId\":" + savedOrder.getId() + "," +
                "\"deliveryPartnerId\":" + partnerId + "," +
                "\"deliveryPartnerName\":\"" + partner.getFullName() + "\"," +
                "\"deliveryOtp\":\"[REDACTED]\"," +
                "\"customerId\":" + savedOrder.getCustomer().getId() +
                "}";

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateId(String.valueOf(savedOrder.getId()))
                .aggregateType("PRODUCT_ORDER")
                .eventType("DELIVERY_ASSIGNED")
                .topic("delivery-assigned")
                .payload(payload)
                .processed(false)
                .build();
        outboxRepository.save(outboxEvent);

        log.info("Order #{} force assigned to delivery partner #{} by store manager/admin.", orderId, partnerId);
        return savedOrder;
    }
}
