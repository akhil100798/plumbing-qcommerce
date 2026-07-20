package com.pqc.core.controller;

import com.pqc.core.dto.MaterialRequestDetailResponse;
import com.pqc.core.dto.MaterialRequestSummaryResponse;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.service.PlumberMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MaterialPickupController {
    private final PlumberMaterialService service;

    @GetMapping("/service-orders/{jobId}/material-requests")
    public List<MaterialRequestSummaryResponse> forJob(@PathVariable Long jobId) {
        return service.serviceOrderRequests(jobId);
    }

    @PostMapping("/material-requests/{id}/submit")
    @PreAuthorize("hasRole('PLUMBER')")
    public MaterialRequestDetailResponse submit(@PathVariable Long id) {
        return service.submit(id);
    }

    @GetMapping("/plumber/material-requests")
    @PreAuthorize("hasRole('PLUMBER')")
    public List<MaterialRequestSummaryResponse> plumberRequests() {
        return service.plumberRequests();
    }

    @GetMapping("/plumber/material-requests/{id}")
    @PreAuthorize("hasRole('PLUMBER')")
    public MaterialRequestDetailResponse plumberRequest(@PathVariable Long id) {
        return service.plumberRequestDetails(id);
    }

    @GetMapping("/store/material-requests")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public List<MaterialRequestSummaryResponse> storeRequests() {
        return service.storeRequests();
    }

    @GetMapping("/store/material-requests/{id}")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse storeRequest(@PathVariable Long id) {
        return service.storeRequestDetails(id);
    }

    @PostMapping("/store/material-requests/{id}/approve")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse approve(@PathVariable Long id) {
        return service.approve(id, null);
    }

    @PostMapping("/store/material-requests/{id}/partially-approve")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse partiallyApprove(@PathVariable Long id, @RequestBody PartialApproval body) {
        return service.approve(id, body.quantities());
    }

    @PostMapping("/store/material-requests/{id}/reject")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse reject(@PathVariable Long id, @RequestBody(required=false) Reason body) {
        return service.reject(id, body == null ? null : body.reason());
    }

    @PostMapping("/store/material-requests/{id}/reserve")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse reserve(@PathVariable Long id) {
        return service.reserve(id);
    }

    @PostMapping("/store/material-requests/{id}/prepare")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse prepare(@PathVariable Long id) {
        return service.prepare(id);
    }

    @PostMapping("/store/material-requests/{id}/ready-for-pickup")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse ready(@PathVariable Long id) {
        return service.ready(id);
    }

    @PostMapping("/plumber/material-requests/{id}/arrived-at-store")
    @PreAuthorize("hasRole('PLUMBER')")
    public MaterialRequestDetailResponse arrived(@PathVariable Long id) {
        return service.arrived(id);
    }

    @PostMapping("/plumber/material-requests/{id}/collect")
    @PreAuthorize("hasRole('PLUMBER')")
    public MaterialRequestDetailResponse collect(@PathVariable Long id) {
        return service.collect(id);
    }

    @PostMapping("/store/material-requests/{id}/confirm-collection")
    @PreAuthorize("hasRole('STORE_MANAGER')")
    public MaterialRequestDetailResponse confirmCollection(@PathVariable Long id) {
        return service.confirmCollection(id);
    }

    @PostMapping("/service-orders/{jobId}/returning-to-customer")
    @PreAuthorize("hasRole('PLUMBER')")
    public ServiceOrder returning(@PathVariable Long jobId) {
        return service.returning(jobId);
    }

    @PostMapping("/service-orders/{jobId}/resume-work")
    @PreAuthorize("hasRole('PLUMBER')")
    public ServiceOrder resume(@PathVariable Long jobId) {
        return service.resume(jobId);
    }

    public record PartialApproval(Map<Long,Integer> quantities) {}
    public record Reason(String reason) {}
}
