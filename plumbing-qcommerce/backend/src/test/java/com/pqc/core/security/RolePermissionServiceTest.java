package com.pqc.core.security;

import com.pqc.core.entity.Permission;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.User;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RolePermissionServiceTest {

    private final RolePermissionService service = new RolePermissionService();

    @Test
    void superAdminHasAllPermissions() {
        assertThat(service.getPermissionsForRole(Role.SUPER_ADMIN))
                .containsExactlyInAnyOrder(Permission.values());
    }

    @Test
    void adminHasExpectedAdminPermissionsWithoutHighestRiskManagementPermissions() {
        Set<Permission> permissions = service.getPermissionsForRole(Role.ADMIN);

        assertThat(permissions)
                .contains(Permission.USER_VIEW, Permission.USER_MANAGE, Permission.ROLE_VIEW, Permission.SYSTEM_SETTINGS_VIEW)
                .doesNotContain(Permission.ROLE_MANAGE, Permission.SYSTEM_SETTINGS_MANAGE);
    }

    @Test
    void operationsAdminHasOrderServiceAndDeliveryPermissions() {
        assertThat(service.getPermissionsForRole(Role.OPERATIONS_ADMIN))
                .contains(
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
                );
    }

    @Test
    void financeAdminHasPaymentSettlementAndRefundPermissions() {
        assertThat(service.getPermissionsForRole(Role.FINANCE_ADMIN))
                .contains(
                        Permission.PAYMENT_VIEW,
                        Permission.PAYMENT_MANAGE,
                        Permission.SETTLEMENT_VIEW,
                        Permission.SETTLEMENT_MANAGE,
                        Permission.REFUND_VIEW,
                        Permission.REFUND_MANAGE,
                        Permission.REPORT_VIEW
                );
    }

    @Test
    void supportAdminHasSupportPermissions() {
        assertThat(service.getPermissionsForRole(Role.SUPPORT_ADMIN))
                .contains(
                        Permission.SUPPORT_TICKET_VIEW,
                        Permission.SUPPORT_TICKET_MANAGE,
                        Permission.ORDER_VIEW,
                        Permission.SERVICE_JOB_VIEW,
                        Permission.REFUND_VIEW
                );
    }

    @Test
    void marketingAdminHasOfferAndNotificationPermissions() {
        assertThat(service.getPermissionsForRole(Role.MARKETING_ADMIN))
                .contains(
                        Permission.OFFER_VIEW,
                        Permission.OFFER_MANAGE,
                        Permission.NOTIFICATION_VIEW,
                        Permission.NOTIFICATION_MANAGE,
                        Permission.REPORT_VIEW
                );
    }

    @Test
    void customerHasNoAdminPermissions() {
        assertThat(service.getPermissionsForRole(Role.CUSTOMER)).isEmpty();
    }

    @Test
    void plumberHasNoAdminPermissions() {
        assertThat(service.getPermissionsForRole(Role.PLUMBER)).isEmpty();
    }

    @Test
    void deliveryPartnerHasNoAdminPermissions() {
        assertThat(service.getPermissionsForRole(Role.DELIVERY_PARTNER)).isEmpty();
    }

    @Test
    void hasAnyPermissionHandlesNullsSafely() {
        assertThat(service.hasAnyPermission(null, Permission.USER_VIEW)).isFalse();
        assertThat(service.hasPermission(User.builder().role(Role.ADMIN).build(), Permission.USER_VIEW)).isTrue();
    }
}
