package com.pqc.core.controller;

import com.pqc.core.dto.LaunchRosterActionRequest;
import com.pqc.core.dto.LaunchRosterPlumberResponse;
import com.pqc.core.dto.LaunchRosterPolicyResponse;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.LaunchRosterManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/launch-roster")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class LaunchRosterManagementController {
    private final LaunchRosterManagementService service;
    private final CurrentUser currentUser;

    @GetMapping("/policies")
    public ResponseEntity<List<LaunchRosterPolicyResponse>> policies() {
        return ResponseEntity.ok(service.serviceLaunchPolicies());
    }

    @GetMapping("/policies/{policyId}/members")
    public ResponseEntity<List<LaunchRosterPlumberResponse>> members(@PathVariable Long policyId) {
        return ResponseEntity.ok(service.roster(policyId));
    }

    @PostMapping("/policies/{policyId}/members/{plumberId}")
    public ResponseEntity<LaunchRosterPlumberResponse> activate(
            @PathVariable Long policyId,
            @PathVariable Long plumberId,
            @Valid @RequestBody LaunchRosterActionRequest request) {
        return ResponseEntity.ok(service.activate(policyId, plumberId, currentUser.require().getId(), request.reason()));
    }

    @PatchMapping("/policies/{policyId}/members/{plumberId}/deactivate")
    public ResponseEntity<LaunchRosterPlumberResponse> deactivate(
            @PathVariable Long policyId,
            @PathVariable Long plumberId,
            @Valid @RequestBody LaunchRosterActionRequest request) {
        return ResponseEntity.ok(service.deactivate(policyId, plumberId, currentUser.require().getId(), request.reason()));
    }
}
