package com.pqc.core.controller;

import com.pqc.core.dto.AdminUserDetailResponse;
import com.pqc.core.dto.AdminUserListResponse;
import com.pqc.core.dto.SuperAdminDashboardResponse;
import com.pqc.core.dto.SystemHealthResponse;
import com.pqc.core.dto.UserStatusUpdateRequest;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.UserStatus;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/super")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;
    private final CurrentUser currentUser;

    @GetMapping("/dashboard")
    public ResponseEntity<SuperAdminDashboardResponse> getDashboard() {
        return ResponseEntity.ok(superAdminService.getDashboard());
    }

    @GetMapping("/users")
    public ResponseEntity<AdminUserListResponse> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(superAdminService.listUsers(role, status, search, page, size));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.getUser(id));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserDetailResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UserStatusUpdateRequest request
    ) {
        UserStatus requestedStatus = request == null ? null : request.status();
        return ResponseEntity.ok(superAdminService.updateStatus(id, requestedStatus, currentUser.require()));
    }

    @GetMapping("/admin-users")
    public ResponseEntity<AdminUserListResponse> getAdminUsers() {
        return ResponseEntity.ok(superAdminService.listAdminUsers());
    }

    @GetMapping("/system-health")
    public ResponseEntity<SystemHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(superAdminService.getSystemHealth());
    }
}
