package com.pqc.core.controller;

import com.pqc.core.dto.CreateOrderRequest;
import com.pqc.core.dto.CustomerConfirmationResponse;
import com.pqc.core.dto.RatingRequest;
import com.pqc.core.dto.RatingResponse;
import com.pqc.core.dto.ServiceOrderStatusHistoryResponse;
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

    /** PATCH/POST /api/v1/orders/{id}/accept — Plumber accepts */
    @RequestMapping(value = "/{id}/accept", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<ServiceOrder> acceptOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.acceptOrder(id, currentUser.require().getId()));
    }

    /** PATCH/POST /api/v1/orders/{id}/arrive — Plumber marks arrival */
    @RequestMapping(value = "/{id}/arrive", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> arriveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.arriveOrder(id));
    }

    /** PATCH/POST /api/v1/orders/{id}/start-navigation or /on-the-way */
    @RequestMapping(value = {"/{id}/start-navigation", "/{id}/on-the-way"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> startNavigation(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /** PATCH/POST /api/v1/orders/{id}/start or /start-work — Plumber marks work started */
    @RequestMapping(value = {"/{id}/start", "/{id}/start-work"}, method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> startOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.startOrder(id));
    }

    /** POST /api/v1/orders/{id}/photos/before */
    @PostMapping("/{id}/photos/before")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<Map<String, String>> uploadBeforePhoto(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "Before photo uploaded successfully", "orderId", String.valueOf(id)));
    }

    /** POST /api/v1/orders/{id}/photos/after */
    @PostMapping("/{id}/photos/after")
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<Map<String, String>> uploadAfterPhoto(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "After photo uploaded successfully", "orderId", String.valueOf(id)));
    }

    /** GET /api/v1/orders/plumber/history — Get current plumber's job history */
    @GetMapping("/plumber/history")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<List<ServiceOrder>> getPlumberHistory() {
        return ResponseEntity.ok(orderService.getOrdersByPlumber(currentUser.require().getId()));
    }

    /** POST/PATCH /api/v1/orders/{id}/complete — Plumber completes job */
    @RequestMapping(value = "/{id}/complete", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('PLUMBER') and @orderAuthorization.isAssignedPlumber(#id, authentication)")
    public ResponseEntity<ServiceOrder> completeOrder(@PathVariable Long id,
                                                       @RequestParam(required = false) BigDecimal partsCharge) {
        return ResponseEntity.ok(orderService.completeOrder(id, partsCharge));
    }

    /** POST/PATCH /api/v1/orders/{id}/confirm — Customer confirms completion */
    @RequestMapping(value = "/{id}/confirm", method = {RequestMethod.POST, RequestMethod.PATCH})
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerConfirmationResponse> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmOrder(id));
    }

    /** POST /api/v1/orders/{id}/rating — Customer submits rating and comment */
    @PostMapping("/{id}/rating")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<RatingResponse> submitRating(@PathVariable Long id, @RequestBody RatingRequest req) {
        return ResponseEntity.ok(orderService.submitRating(id, req.getRating(), req.getComment()));
    }

    /** GET /api/v1/orders/{id}/rating — Retrieve rating for order */
    @GetMapping("/{id}/rating")
    public ResponseEntity<RatingResponse> getRating(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getRating(id));
    }

    /** GET /api/v1/orders/{id}/history — Retrieve status history for order */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ServiceOrderStatusHistoryResponse>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getHistory(id));
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

    /** GET /api/v1/orders/status/{status} — For store manager dashboard */
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

