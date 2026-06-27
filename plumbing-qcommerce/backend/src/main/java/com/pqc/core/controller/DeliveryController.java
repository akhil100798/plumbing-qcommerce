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

import java.util.List;

@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final CheckoutService checkoutService;
    private final DeliveryService deliveryService;
    private final ProductOrderRepository orderRepository;
    private final CurrentUser currentUser;

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
