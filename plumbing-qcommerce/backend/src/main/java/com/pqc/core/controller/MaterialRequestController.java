package com.pqc.core.controller;

import com.pqc.core.dto.CartItemDTO;
import com.pqc.core.dto.MaterialRequestDetailResponse;
import com.pqc.core.dto.MaterialStatusHistoryResponse;
import com.pqc.core.service.PlumberMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MaterialRequestController {

    private final PlumberMaterialService plumberMaterialService;

    // POST /api/v1/service-orders/{serviceOrderId}/material-requests or POST /api/v1/material-requests
    @PostMapping({"/service-orders/{serviceOrderId}/material-requests", "/material-requests"})
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<MaterialRequestDetailResponse> createMaterialRequest(
            @PathVariable(required = false) Long serviceOrderId,
            @RequestBody MaterialRequestBody body) {
        Long jobId = serviceOrderId != null ? serviceOrderId : body.serviceOrderId();
        MaterialRequestDetailResponse detail = plumberMaterialService.createMaterialRequest(
                jobId, body.storeId(), body.items());
        return ResponseEntity.status(201).body(detail);
    }

    // PUT /api/v1/material-requests/{requestId}
    @PutMapping("/material-requests/{requestId}")
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<MaterialRequestDetailResponse> updateMaterialRequest(
            @PathVariable Long requestId,
            @RequestBody MaterialRequestBody body) {
        MaterialRequestDetailResponse detail = plumberMaterialService.updateMaterialRequest(
                requestId, body.storeId(), body.items());
        return ResponseEntity.ok(detail);
    }

    // POST /api/v1/material-requests/{requestId}/cancel
    @PostMapping("/material-requests/{requestId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MaterialRequestDetailResponse> cancelMaterialRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) CancelRequestBody body) {
        String reason = body != null ? body.reason() : null;
        MaterialRequestDetailResponse detail = plumberMaterialService.cancelMaterialRequest(requestId, reason);
        return ResponseEntity.ok(detail);
    }

    // GET /api/v1/material-requests/{requestId}/history
    @GetMapping("/material-requests/{requestId}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MaterialStatusHistoryResponse>> getMaterialRequestHistory(
            @PathVariable Long requestId) {
        List<MaterialStatusHistoryResponse> history = plumberMaterialService.getHistory(requestId);
        return ResponseEntity.ok(history);
    }

    // DTOs for request bodies
    public record MaterialRequestBody(
            Long serviceOrderId,
            Long storeId,
            List<CartItemDTO> items) {}

    public record CancelRequestBody(
            String reason) {}
}
