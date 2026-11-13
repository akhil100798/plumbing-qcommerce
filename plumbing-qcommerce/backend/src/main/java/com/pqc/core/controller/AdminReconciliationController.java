package com.pqc.core.controller;

import com.pqc.core.dto.Phase2ReconciliationResponse;
import com.pqc.core.service.Phase2AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/service-jobs/{orderId}/reconciliation")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','OPERATIONS_ADMIN')")
public class AdminReconciliationController {
    private final Phase2AuthorizationService authorization;

    @GetMapping
    public List<Phase2ReconciliationResponse> history(@PathVariable Long orderId) {
        return authorization.history(orderId).stream().map(Phase2ReconciliationResponse::from).toList();
    }
}
