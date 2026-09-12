package com.pqc.core.controller;

import com.pqc.core.dto.CheckoutRequest;
import com.pqc.core.dto.OrderDetailDTO;
import com.pqc.core.dto.OrderDetailResponse;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.entity.ProductOrderStatus;
import com.pqc.core.entity.User;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.CheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final CurrentUser currentUser;

    @PostMapping("/reserve")
    public ResponseEntity<ProductOrder> reserveStock(@jakarta.validation.Valid @RequestBody CheckoutRequest request) {
        Long customerId = currentUser.require().getId();
        ProductOrder order = checkoutService.reserveStock(customerId, request.getStoreId(), request.getItems());
        return ResponseEntity.ok(order);
    }

    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<String> confirmPayment(@PathVariable Long orderId) {
        checkoutService.confirmPayment(orderId);
        return ResponseEntity.ok("Payment confirmed and stock reservation finalized.");
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<String> releaseReservation(@PathVariable Long orderId) {
        checkoutService.releaseReservation(orderId);
        return ResponseEntity.ok("Stock reservation released back to inventory.");
    }

    @GetMapping("/orders/status/{status}")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<OrderDetailResponse>> getOrdersByStatus(@PathVariable ProductOrderStatus status) {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getOrdersByStatusForUser(status, user));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDetailDTO> getOrderById(@PathVariable Long id) {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getOrderByIdForUser(id, user));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<ProductOrder>> getMyOrders() {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getMyOrders(user.getId()));
    }

    @GetMapping("/material-requests/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<OrderDetailResponse>> getCustomerMaterialRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getCustomerMaterialRequestsForUser(user.getId()));
    }

    @GetMapping("/material-requests/plumber")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<OrderDetailResponse>> getPlumberMaterialRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getPlumberMaterialRequestsForUser(user.getId()));
    }

    @GetMapping("/material-requests/store")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<OrderDetailResponse>> getStoreMaterialRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(checkoutService.getStoreMaterialRequestsForUser(user));
    }

    @PatchMapping("/orders/{id}/accept")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> acceptOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.OrderActionRequest request) {
        return ResponseEntity.ok(checkoutService.acceptOrder(id, request));
    }

    @PatchMapping("/orders/{id}/pack")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> packOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.PackOrderRequest request) {
        return ResponseEntity.ok(checkoutService.packOrder(id, request));
    }

    @PostMapping("/orders/{id}/handover")
    @PreAuthorize("hasAnyRole('STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<OrderDetailResponse> handoverOrder(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.pqc.core.dto.HandoverRequest request) {
        return ResponseEntity.ok(checkoutService.handoverOrder(id, request));
    }
}
