package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.service.Phase2QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders/{orderId}/addenda")
public class MaterialAddendumController {
    private final Phase2QuoteService addenda;

    @PostMapping @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberMaterialAddendumResponse> create(@PathVariable Long orderId,
            @Valid @RequestBody MaterialAddendumCreateRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(addenda.createAddendum(orderId, request, key));
    }

    @PatchMapping("/{addendumId}") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberMaterialAddendumResponse> update(@PathVariable Long orderId, @PathVariable Long addendumId,
            @Valid @RequestBody MaterialAddendumUpdateRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(addenda.updateAddendum(orderId, addendumId, request, key));
    }

    @PostMapping("/{addendumId}/publish") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberMaterialAddendumResponse> publish(@PathVariable Long orderId, @PathVariable Long addendumId,
            @RequestBody(required = false) MaterialAddendumPublishRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(addenda.publishAddendum(orderId, addendumId, request == null ? null : request.expiryHours(), key));
    }

    public record MaterialAddendumPublishRequest(Integer expiryHours) { }

    @GetMapping("/current") @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerMaterialAddendumResponse> current(@PathVariable Long orderId) {
        return ResponseEntity.ok(addenda.currentAddendum(orderId));
    }

    @GetMapping("/{addendumId}") @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerMaterialAddendumResponse> read(@PathVariable Long orderId, @PathVariable Long addendumId) {
        return ResponseEntity.ok(addenda.readCustomerAddendum(orderId, addendumId));
    }

    @GetMapping @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<CustomerMaterialAddendumResponse>> history(@PathVariable Long orderId) {
        return ResponseEntity.ok(addenda.customerAddendumHistory(orderId));
    }

    @PostMapping("/{addendumId}/approve") @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerMaterialAddendumResponse> approve(@PathVariable Long orderId, @PathVariable Long addendumId,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(addenda.approveAddendum(orderId, addendumId, key));
    }

    @PostMapping("/{addendumId}/reject") @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerMaterialAddendumResponse> reject(@PathVariable Long orderId, @PathVariable Long addendumId,
            @Valid @RequestBody QuoteRejectRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return ResponseEntity.ok(addenda.rejectAddendum(orderId, addendumId, request, key));
    }
}
