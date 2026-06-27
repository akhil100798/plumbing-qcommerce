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
 * POST /api/v1/delivery/material-request
 *   Body: { serviceOrderId, storeId, items: [ {productId, quantity}, ... ] }
 *   Auth: PLUMBER only
 */
@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class MaterialRequestController {

    private final PlumberMaterialService plumberMaterialService;

    @PostMapping("/material-request")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<ProductOrder> createMaterialRequest(
            @RequestBody MaterialRequestBody body) {
        ProductOrder order = plumberMaterialService.createMaterialRequest(
                body.serviceOrderId(), body.storeId(), body.items());
        return ResponseEntity.ok(order);
    }

    // DTO for the request body
    public record MaterialRequestBody(
            Long serviceOrderId,
            Long storeId,
            List<CartItemDTO> items) {}
}
