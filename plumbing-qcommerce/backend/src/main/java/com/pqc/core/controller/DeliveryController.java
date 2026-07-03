package com.pqc.core.controller;

import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.repository.ProductOrderRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.CheckoutService;
import com.pqc.core.service.DeliveryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.core.env.Environment;
import com.pqc.core.service.DeliveryOtpService;
import java.util.List;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final CheckoutService checkoutService;
    private final DeliveryService deliveryService;
    private final ProductOrderRepository orderRepository;
    private final CurrentUser currentUser;
    private final DeliveryOtpService deliveryOtpService;
    private final Environment env;

    @GetMapping("/available")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<List<ProductOrder>> getAvailableOrders() {
        List<ProductOrder> confirmedOrders = orderRepository.findByStatus(ProductOrderStatus.CONFIRMED);
        return ResponseEntity.ok(confirmedOrders);
    }

    @PatchMapping("/{orderId}/accept")
    @PreAuthorize("hasRole('DELIVERY_PARTNER')")
    public ResponseEntity<ProductOrder> acceptDelivery(
            @PathVariable Long orderId,
            @RequestParam(required = false) String otp) {
        Long partnerId = currentUser.require().getId();
        ProductOrder order = deliveryService.assignDeliveryPartner(orderId, partnerId, otp);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/confirm-otp")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ProductOrder> confirmDelivery(
            @PathVariable Long orderId,
            @RequestBody(required = false) OtpRequest body,
            @RequestParam(required = false) String otp) {
        String code = otp;
        if (code == null && body != null) {
            code = body.getOtp();
        }
        if (code == null) {
            throw new IllegalArgumentException("OTP code must be provided.");
        }
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        if (!order.getCustomer().getId().equals(currentUser.require().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this order.");
        }
        ProductOrder confirmedOrder = checkoutService.confirmDelivery(orderId, code);
        return ResponseEntity.ok(confirmedOrder);
    }

    @PostMapping("/{orderId}/otp/generate")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> generateOtp(@PathVariable Long orderId) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        // Correct handover/delivery status check
        if (order.getStatus() != ProductOrderStatus.PACKING &&
            order.getStatus() != ProductOrderStatus.READY_FOR_PICKUP &&
            order.getStatus() != ProductOrderStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot generate OTP for order in status: " + order.getStatus());
        }

        if (order.getDeliveryPartner() == null) {
            throw new IllegalStateException("No delivery partner assigned to order #" + orderId);
        }
        String otp = deliveryOtpService.generateOtp(order.getId(), order.getDeliveryPartner().getId());
        order.setDeliveryOtp(otp);
        orderRepository.save(order);
        
        boolean isProd = env.getActiveProfiles() != null && java.util.Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (isProd) {
            return ResponseEntity.ok(java.util.Map.of("orderId", orderId, "status", "OTP_SENT"));
        } else {
            return ResponseEntity.ok(java.util.Map.of("orderId", orderId, "otp", otp, "status", "OTP_SENT"));
        }
    }

    @PostMapping("/{orderId}/verify-otp")
    @PreAuthorize("hasAnyRole('DELIVERY_PARTNER', 'ADMIN')")
    public ResponseEntity<Boolean> verifyOtp(
            @PathVariable Long orderId,
            @RequestBody OtpRequest body) {
        if (body == null || body.getOtp() == null) {
            throw new IllegalArgumentException("OTP code must be provided.");
        }
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        if (order.getDeliveryPartner() == null) {
            throw new IllegalStateException("No delivery partner assigned to order #" + orderId);
        }
        boolean isValid = deliveryOtpService.verifyOtp(order.getId(), order.getDeliveryPartner().getId(), body.getOtp());
        return ResponseEntity.ok(isValid);
    }

    @GetMapping("/{orderId}/status")
    public ResponseEntity<ProductOrder> getOrderStatus(@PathVariable Long orderId) {
        ProductOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        return ResponseEntity.ok(order);
    }

    @Data
    public static class OtpRequest {
        private String otp;
    }
}
