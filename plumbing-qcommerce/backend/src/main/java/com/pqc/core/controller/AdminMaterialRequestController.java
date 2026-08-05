package com.pqc.core.controller;

import com.pqc.core.dto.MaterialRequestDetailResponse;
import com.pqc.core.dto.MaterialRequestSummaryResponse;
import com.pqc.core.service.PlumberMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/material-requests")
@RequiredArgsConstructor
public class AdminMaterialRequestController {

    private final PlumberMaterialService service;

    // GET /api/v1/admin/material-requests
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN')")
    public ResponseEntity<Page<MaterialRequestSummaryResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long plumberId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long serviceOrderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<MaterialRequestSummaryResponse> results = service.adminList(
                status, storeId, plumberId, customerId, serviceOrderId, page, size);
        return ResponseEntity.ok(results);
    }

    // GET /api/v1/admin/material-requests/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN')")
    public ResponseEntity<MaterialRequestDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.adminDetail(id));
    }

    // POST /api/v1/admin/material-requests/{id}/reassign-store
    @PostMapping("/{id}/reassign-store")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN')")
    public ResponseEntity<MaterialRequestDetailResponse> reassignStore(
            @PathVariable Long id,
            @RequestBody ReassignStoreRequest body) {
        return ResponseEntity.ok(service.adminReassignStore(id, body.storeId()));
    }

    // POST /api/v1/admin/material-requests/{id}/cancel
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN')")
    public ResponseEntity<MaterialRequestDetailResponse> cancel(
            @PathVariable Long id,
            @RequestBody(required = false) CancelRequest body) {
        String reason = body != null ? body.reason() : null;
        return ResponseEntity.ok(service.adminCancel(id, reason));
    }

    public record ReassignStoreRequest(Long storeId) {}
    public record CancelRequest(String reason) {}
}
