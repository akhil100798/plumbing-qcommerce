package com.pqc.core.controller;

import com.pqc.core.dto.CustomerDiagnosisResponse;
import com.pqc.core.service.ServiceDiagnosisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/customer/orders/{orderId}/diagnosis")
public class CustomerDiagnosisController {
    private final ServiceDiagnosisService diagnoses;
    @GetMapping @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerDiagnosisResponse> read(@PathVariable Long orderId) { return ResponseEntity.ok(diagnoses.customerRead(orderId)); }
}
