package com.pqc.core.controller;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.entity.ProductOrder;
import com.pqc.core.service.PlumberMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Phase 3 — REST endpoint for mid-job material requests.
 *
 * POST /api/v1/service-orders/{serviceOrderId}/material-requests
 *   Body: { serviceOrderId, storeId, items: [ {productId, quantity}, ... ] }
 *   Auth: PLUMBER only
 */
@RestController
@RequestMapping("/api/v1/service-orders")
@RequiredArgsConstructor
public class MaterialRequestController {

    private final PlumberMaterialService plumberMaterialService;

    @PostMapping("/{serviceOrderId}/material-requests")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<ProductOrder> createMaterialRequest(
            @PathVariable Long serviceOrderId,
            @RequestBody MaterialRequestBody body) {
        ProductOrder order = plumberMaterialService.createMaterialRequest(
                serviceOrderId, body.storeId(), body.items());
        return ResponseEntity.status(201).body(order);
    }

    // DTO for the request body
    public record MaterialRequestBody(
            Long storeId,
            List<CartItemDTO> items) {}
}
