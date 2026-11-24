package com.pqc.core.controller;

import com.pqc.core.dto.CustomerDiagnosisEvidenceResponse;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.CustomerDiagnosisEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/customer/orders/{orderId}/diagnosis/evidence")
public class CustomerDiagnosisEvidenceController {
    private final CustomerDiagnosisEvidenceService evidence;

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<CustomerDiagnosisEvidenceResponse>> list(@PathVariable Long orderId) {
        return ResponseEntity.ok(evidence.list(orderId));
    }

    @GetMapping("/{photoId}/file")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Resource> file(@PathVariable Long orderId, @PathVariable Long photoId) {
        CustomerDiagnosisEvidenceService.PhotoFile result = evidence.file(orderId, photoId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(result.contentType())).body(result.resource());
    }
}
