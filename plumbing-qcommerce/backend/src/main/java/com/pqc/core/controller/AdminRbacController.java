package com.pqc.core.controller;

import com.pqc.core.dto.AssignRoleRequest;
import com.pqc.core.dto.CurrentAdminAccessResponse;
import com.pqc.core.dto.RolePermissionResponse;
import com.pqc.core.entity.Permission;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import com.pqc.core.repository.UserRepository;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.security.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/admin/rbac")
@RequiredArgsConstructor
public class AdminRbacController {

    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final RolePermissionService rolePermissionService;

    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Role[]> getRoles() {
        return ResponseEntity.ok(Role.values());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<Permission[]> getPermissions() {
        return ResponseEntity.ok(Permission.values());
    }

    @GetMapping("/roles/{role}/permissions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<RolePermissionResponse> getPermissionsForRole(@PathVariable Role role) {
        return ResponseEntity.ok(new RolePermissionResponse(role, rolePermissionService.getPermissionsForRole(role)));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_ADMIN', 'PLUMBER_MANAGER', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'MARKETING_ADMIN', 'STORE_MANAGER')")
    public ResponseEntity<CurrentAdminAccessResponse> getCurrentAdminAccess() {
        User user = currentUser.require();
        return ResponseEntity.ok(toCurrentAdminAccessResponse(user));
    }

    @PostMapping("/users/{userId}/role")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<RolePermissionResponse> assignRole(
            @PathVariable Long userId,
            @RequestBody AssignRoleRequest request
    ) {
        User actor = currentUser.require();
        Role requestedRole = request != null ? request.getRole() : null;
        if (requestedRole == null) {
            return ResponseEntity.badRequest().build();
        }

        User target = userRepository.findById(userId).orElse(null);
        if (target == null) {
            return ResponseEntity.notFound().build();
        }

        if (!canAssignRole(actor, target, requestedRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        target.setRole(requestedRole);
        User saved = userRepository.save(target);
        return ResponseEntity.ok(new RolePermissionResponse(saved.getRole(), rolePermissionService.getPermissionsForRole(saved.getRole())));
    }

    private boolean canAssignRole(User actor, User target, Role requestedRole) {
        if (actor == null || actor.getRole() == null || requestedRole == null) {
            return false;
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (actor.getRole() != Role.ADMIN) {
            return false;
        }
        return requestedRole == Role.ADMIN
                || requestedRole == Role.OPERATIONS_ADMIN
                || requestedRole == Role.PLUMBER_MANAGER
                || requestedRole == Role.FINANCE_ADMIN
                || requestedRole == Role.SUPPORT_ADMIN
                || requestedRole == Role.MARKETING_ADMIN;
    }

    private CurrentAdminAccessResponse toCurrentAdminAccessResponse(User user) {
        return new CurrentAdminAccessResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                rolePermissionService.getPermissionsForRole(user.getRole())
        );
    }
}
