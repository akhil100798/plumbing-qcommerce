import { apiRequest } from "./apiClient";
import type { PlatformRole } from "./rbacService";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BLOCKED";

export interface SuperAdminDashboardResponse {
  totalCustomers: number;
  totalPlumbers: number;
  totalStoreManagers: number;
  totalDeliveryPartners: number;
  totalAdmins: number;
  totalStores: number;
  totalProductOrders: number;
  totalServiceOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeServiceJobs: number;
  pendingMaterialRequests: number;
}

export interface AdminUserSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: PlatformRole;
  status: UserStatus;
  createdAt?: string | null;
  lastActiveAt?: string | null;
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUserDetailResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: PlatformRole;
  status: UserStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastActiveAt?: string | null;
  linkedStore?: {
    id: number;
    name: string;
    address: string;
  } | null;
  activitySummary?: {
    productOrders: number;
    serviceJobs: number;
    deliveries: number;
    managedStores: number;
  } | null;
}

export interface UserStatusUpdateRequest {
  status: UserStatus;
}

export interface SystemHealthResponse {
  backendStatus: string;
  databaseStatus: string;
  redisStatus: string;
  kafkaStatus: string;
  edgeServiceStatus: string;
  timestamp: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: number;
  role: string;
  email: string;
}

export interface UsersQuery {
  role?: PlatformRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  size?: number;
}

function toQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const output = query.toString();
  return output ? `?${output}` : "";
}

export async function getDashboard() {
  return apiRequest<SuperAdminDashboardResponse>("/api/v1/admin/super/dashboard");
}

export async function listUsers(query: UsersQuery = {}) {
  return apiRequest<AdminUserListResponse>(
    `/api/v1/admin/super/users${toQueryString({
      role: query.role,
      status: query.status,
      search: query.search,
      page: query.page ?? 0,
      size: query.size ?? 10,
    })}`
  );
}

export async function getUser(userId: string | number) {
  return apiRequest<AdminUserDetailResponse>(`/api/v1/admin/super/users/${userId}`);
}

export async function updateUserStatus(userId: string | number, status: UserStatus) {
  return apiRequest<AdminUserDetailResponse>(`/api/v1/admin/super/users/${userId}/status`, {
    method: "PATCH",
    body: { status } satisfies UserStatusUpdateRequest,
  });
}

export async function listAdminUsers() {
  return apiRequest<AdminUserListResponse>("/api/v1/admin/super/admin-users");
}

export async function getSystemHealth() {
  return apiRequest<SystemHealthResponse>("/api/v1/admin/super/system-health");
}

export async function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
}

export async function logout() {
  return apiRequest<string>("/api/v1/auth/logout", {
    method: "POST",
    responseType: "text",
  });
}
