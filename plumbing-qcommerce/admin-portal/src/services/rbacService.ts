import { apiRequest } from "./apiClient";

export const PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATIONS_ADMIN",
  "PLUMBER_MANAGER",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "MARKETING_ADMIN",
  "STORE_MANAGER",
  "CUSTOMER",
  "PLUMBER",
  "DELIVERY_PARTNER",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATIONS_ADMIN",
  "PLUMBER_MANAGER",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "MARKETING_ADMIN",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const SUPER_ADMIN_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;
export const OPERATIONS_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN"] as const;
export const FINANCE_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN"] as const;
export const SUPPORT_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT_ADMIN"] as const;
export const PLUMBER_MANAGER_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "PLUMBER_MANAGER"] as const;
export const MARKETING_PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "MARKETING_ADMIN"] as const;
export const PORTAL_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_ADMIN", "PLUMBER_MANAGER", "FINANCE_ADMIN", "SUPPORT_ADMIN", "MARKETING_ADMIN"] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

export const PERMISSION_VALUES = [
  "USER_VIEW",
  "USER_MANAGE",
  "PLUMBER_VIEW",
  "PLUMBER_MANAGE",
  "PLUMBER_KYC_APPROVE",
  "STORE_VIEW",
  "STORE_MANAGE",
  "ORDER_VIEW",
  "ORDER_MANAGE",
  "SERVICE_JOB_VIEW",
  "SERVICE_JOB_MANAGE",
  "DELIVERY_VIEW",
  "DELIVERY_MANAGE",
  "MATERIAL_REQUEST_VIEW",
  "MATERIAL_REQUEST_MANAGE",
  "PAYMENT_VIEW",
  "PAYMENT_MANAGE",
  "SETTLEMENT_VIEW",
  "SETTLEMENT_MANAGE",
  "REFUND_VIEW",
  "REFUND_MANAGE",
  "SUPPORT_TICKET_VIEW",
  "SUPPORT_TICKET_MANAGE",
  "OFFER_VIEW",
  "OFFER_MANAGE",
  "NOTIFICATION_VIEW",
  "NOTIFICATION_MANAGE",
  "REPORT_VIEW",
  "AI_ANALYTICS_VIEW",
  "SYSTEM_SETTINGS_VIEW",
  "SYSTEM_SETTINGS_MANAGE",
  "ROLE_VIEW",
  "ROLE_MANAGE",
] as const;

export type PermissionValue = (typeof PERMISSION_VALUES)[number];

export interface CurrentAdminAccess {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: PortalRole | Exclude<PlatformRole, PortalRole>;
  permissions: PermissionValue[];
}

export interface RolePermissionResponse {
  role: PlatformRole;
  permissions: PermissionValue[];
}

export async function getCurrentAdminAccess() {
  return apiRequest<CurrentAdminAccess>("/api/v1/admin/rbac/me");
}

export async function listRoles() {
  return apiRequest<PlatformRole[]>("/api/v1/admin/rbac/roles");
}

export async function listPermissions() {
  return apiRequest<PermissionValue[]>("/api/v1/admin/rbac/permissions");
}

export async function getRolePermissions(role: PlatformRole) {
  return apiRequest<RolePermissionResponse>(`/api/v1/admin/rbac/roles/${encodeURIComponent(role)}/permissions`);
}
