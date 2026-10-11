package com.pqc.core.controller;

import com.pqc.core.dto.*;
import com.pqc.core.service.ServiceDiagnosisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/orders/{orderId}/diagnosis")
public class ServiceDiagnosisController {
    private final ServiceDiagnosisService diagnoses;

    @PostMapping @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberDiagnosisResponse> create(@PathVariable Long orderId, @Valid @RequestBody DiagnosisDraftRequest request, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.create(orderId, request, key)); }
    @PatchMapping("/{diagnosisId}") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberDiagnosisResponse> update(@PathVariable Long orderId, @PathVariable Long diagnosisId, @Valid @RequestBody DiagnosisDraftUpdateRequest request, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.update(orderId, diagnosisId, request, key)); }
    @PostMapping("/{diagnosisId}/evidence") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<DiagnosisEvidenceResponse> evidence(@PathVariable Long orderId, @PathVariable Long diagnosisId, @RequestParam("file") MultipartFile file, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.linkEvidence(orderId, diagnosisId, file, key)); }
    @PostMapping("/{diagnosisId}/submit") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberDiagnosisResponse> submit(@PathVariable Long orderId, @PathVariable Long diagnosisId, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.submit(orderId, diagnosisId, key)); }
    @PostMapping("/{diagnosisId}/revise") @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberDiagnosisResponse> revise(@PathVariable Long orderId, @PathVariable Long diagnosisId, @Valid @RequestBody DiagnosisDraftRequest request, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.createRevision(orderId, diagnosisId, request, key)); }
    @PostMapping("/{diagnosisId}/cancel") @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','OPERATIONS_ADMIN')")
    public ResponseEntity<PlumberDiagnosisResponse> cancel(@PathVariable Long orderId, @PathVariable Long diagnosisId, @RequestHeader(value="Idempotency-Key", required=false) String key) { return ResponseEntity.ok(diagnoses.cancel(orderId, diagnosisId, key)); }
    @GetMapping @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<PlumberDiagnosisResponse> read(@PathVariable Long orderId) { return ResponseEntity.ok(diagnoses.plumberRead(orderId)); }
}
