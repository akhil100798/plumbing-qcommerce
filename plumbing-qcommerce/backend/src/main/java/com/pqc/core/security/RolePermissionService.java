package com.pqc.core.security;

import com.pqc.core.entity.Permission;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Set;

@Service
public class RolePermissionService {

    private final EnumMap<Role, EnumSet<Permission>> permissionsByRole = new EnumMap<>(Role.class);

    public RolePermissionService() {
        permissionsByRole.put(Role.SUPER_ADMIN, EnumSet.allOf(Permission.class));

        EnumSet<Permission> adminPermissions = EnumSet.allOf(Permission.class);
        adminPermissions.remove(Permission.ROLE_MANAGE);
        adminPermissions.remove(Permission.SYSTEM_SETTINGS_MANAGE);
        permissionsByRole.put(Role.ADMIN, adminPermissions);

        permissionsByRole.put(Role.OPERATIONS_ADMIN, EnumSet.of(
                Permission.ORDER_VIEW,
                Permission.ORDER_MANAGE,
                Permission.SERVICE_JOB_VIEW,
                Permission.SERVICE_JOB_MANAGE,
                Permission.DELIVERY_VIEW,
                Permission.DELIVERY_MANAGE,
                Permission.MATERIAL_REQUEST_VIEW,
                Permission.MATERIAL_REQUEST_MANAGE,
                Permission.REPORT_VIEW,
                Permission.AI_ANALYTICS_VIEW
        ));

        permissionsByRole.put(Role.PLUMBER_MANAGER, EnumSet.of(
                Permission.PLUMBER_VIEW,
                Permission.PLUMBER_MANAGE,
                Permission.PLUMBER_KYC_APPROVE,
                Permission.SERVICE_JOB_VIEW,
                Permission.REPORT_VIEW
        ));

        permissionsByRole.put(Role.FINANCE_ADMIN, EnumSet.of(
                Permission.PAYMENT_VIEW,
                Permission.PAYMENT_MANAGE,
                Permission.SETTLEMENT_VIEW,
                Permission.SETTLEMENT_MANAGE,
                Permission.REFUND_VIEW,
                Permission.REFUND_MANAGE,
                Permission.REPORT_VIEW
        ));

        permissionsByRole.put(Role.SUPPORT_ADMIN, EnumSet.of(
                Permission.SUPPORT_TICKET_VIEW,
                Permission.SUPPORT_TICKET_MANAGE,
                Permission.ORDER_VIEW,
                Permission.SERVICE_JOB_VIEW,
                Permission.REFUND_VIEW
        ));

        permissionsByRole.put(Role.MARKETING_ADMIN, EnumSet.of(
                Permission.OFFER_VIEW,
                Permission.OFFER_MANAGE,
                Permission.NOTIFICATION_VIEW,
                Permission.NOTIFICATION_MANAGE,
                Permission.REPORT_VIEW
        ));

        permissionsByRole.put(Role.STORE_MANAGER, EnumSet.of(
                Permission.STORE_VIEW,
                Permission.STORE_MANAGE,
                Permission.ORDER_VIEW,
                Permission.ORDER_MANAGE,
                Permission.MATERIAL_REQUEST_VIEW,
                Permission.MATERIAL_REQUEST_MANAGE
        ));

        permissionsByRole.put(Role.CUSTOMER, EnumSet.noneOf(Permission.class));
        permissionsByRole.put(Role.PLUMBER, EnumSet.noneOf(Permission.class));
        permissionsByRole.put(Role.DELIVERY_PARTNER, EnumSet.noneOf(Permission.class));
    }

    public Set<Permission> getPermissionsForRole(Role role) {
        if (role == null) {
            return EnumSet.noneOf(Permission.class);
        }
        EnumSet<Permission> permissions = permissionsByRole.get(role);
        if (permissions == null || permissions.isEmpty()) {
            return EnumSet.noneOf(Permission.class);
        }
        return EnumSet.copyOf(permissions);
    }

    public boolean hasPermission(User user, Permission permission) {
        return user != null
                && permission != null
                && getPermissionsForRole(user.getRole()).contains(permission);
    }

    public boolean hasAnyPermission(User user, Permission... permissions) {
        if (user == null || permissions == null || permissions.length == 0) {
            return false;
        }
        Set<Permission> userPermissions = getPermissionsForRole(user.getRole());
        for (Permission permission : permissions) {
            if (permission != null && userPermissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }
}
