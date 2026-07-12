package com.pqc.core.controller;

import com.pqc.core.dto.CreateOrderRequest;
import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.RequestType;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.service.ServiceOrderService;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class ServiceOrderController {

    private final ServiceOrderService orderService;
    private final CurrentUser currentUser;

    /**
     * POST /api/v1/orders — Customer creates a service request.
     * BUG-11 fix: Uses typed DTO instead of raw Map to prevent NPE on wrong field names.
     * BUG-12 fix: Returns 400 for invalid requestType enum values.
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest req) {
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "description is required"));
        }
        if (req.getLatitude() == null || req.getLongitude() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "latitude and longitude are required"));
        }

        RequestType type;
        try {
            String rt = req.getRequestType() != null ? req.getRequestType() : "NEARBY_AUTO";
            type = RequestType.valueOf(rt.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid requestType. Valid values: NEARBY_AUTO, STORE_ROUTED, DIRECT_PLUMBER"
            ));
        }

        Long customerId = currentUser.require().getId();
        return ResponseEntity.ok(orderService.createOrder(
                customerId, req.getDescription(), req.getLatitude(), req.getLongitude(), type));
    }

    /** PATCH /api/v1/orders/{id}/accept?plumberId=X — Plumber/Store Manager accepts */
    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<ServiceOrder> acceptOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.acceptOrder(id, currentUser.require().getId()));
    }

    /** PATCH /api/v1/orders/{id}/arrive — Plumber marks arrival */
    @PatchMapping("/{id}/arrive")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> arriveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.arriveOrder(id));
    }

    /** PATCH /api/v1/orders/{id}/start — Plumber marks work started */
    @PatchMapping("/{id}/start")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> startOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.startOrder(id));
    }

    /** PATCH /api/v1/orders/{id}/complete — Plumber completes job, billing is calculated */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> completeOrder(@PathVariable Long id,
                                                       @RequestParam(required = false) BigDecimal partsCharge) {
        return ResponseEntity.ok(orderService.completeOrder(id, partsCharge));
    }

    /** PATCH /api/v1/orders/{id}/cancel */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("@orderAuthorization.canCancel(#id, authentication)")
    public ResponseEntity<ServiceOrder> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    /** GET /api/v1/orders/customer/{customerId} */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("@orderAuthorization.canReadCustomer(#customerId, authentication)")
    public ResponseEntity<List<ServiceOrder>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    /** GET /api/v1/orders/plumber — Get current plumber's service orders */
    @GetMapping("/plumber")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<ServiceOrder>> getByPlumber() {
        return ResponseEntity.ok(orderService.getOrdersByPlumber(currentUser.require().getId()));
    }

    /** GET /api/v1/orders/status/{status} — For store manager dashboard (all PENDING) */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('PLUMBER', 'STORE_MANAGER', 'ADMIN')")
    public ResponseEntity<List<ServiceOrder>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(OrderStatus.valueOf(status.toUpperCase())));
    }

    /** GET /api/v1/orders/{id} */
    @GetMapping("/{id}")
    @PreAuthorize("@orderAuthorization.canRead(#id, authentication)")
    public ResponseEntity<ServiceOrder> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }
}
