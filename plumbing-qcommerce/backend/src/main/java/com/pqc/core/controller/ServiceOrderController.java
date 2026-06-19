package com.pqc.core.controller;

import com.pqc.core.api.order.CompleteOrderRequest;
import com.pqc.core.api.order.CreateOrderRequest;
import com.pqc.core.api.order.OrderResponse;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.ServiceOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService orderService;
    private final CurrentUser currentUser;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Long customerId = currentUser.require().getId();
        return ResponseEntity.ok(OrderResponse.from(orderService.createOrder(
                customerId,
                request.description(),
                request.latitude(),
                request.longitude(),
                request.resolvedRequestType())));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<OrderResponse> acceptOrder(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.acceptOrder(id, currentUser.require().getId())));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<OrderResponse> startOrder(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.startOrder(id)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<OrderResponse> completeOrder(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CompleteOrderRequest request,
            @RequestParam(required = false) BigDecimal partsCharge) {
        BigDecimal charge = request == null ? partsCharge : request.resolvedPartsCharge();
        return ResponseEntity.ok(OrderResponse.from(orderService.completeOrder(id, charge)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("@orderAuthorization.canCancel(#id, authentication)")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.cancelOrder(id)));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("@orderAuthorization.canReadCustomer(#customerId, authentication)")
    public ResponseEntity<List<OrderResponse>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId).stream()
                .map(OrderResponse::from)
                .toList());
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('PLUMBER', 'STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<OrderResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(OrderStatus.valueOf(status.toUpperCase())).stream()
                .map(OrderResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@orderAuthorization.canRead(#id, authentication)")
    public ResponseEntity<OrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.getOrderById(id)));
    }
}
