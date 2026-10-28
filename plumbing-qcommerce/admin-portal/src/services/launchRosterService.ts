import { apiRequest } from "./apiClient";

export interface LaunchRosterPolicy {
  policyId: number;
  policyKey: string;
  active: boolean;
  rosterEnforcementEnabled: boolean;
}

export interface LaunchRosterPlumber {
  plumberId: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  userStatus: "ACTIVE" | "SUSPENDED" | "BLOCKED";
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  availabilityStatus: "ONLINE" | "OFFLINE" | "BUSY" | "SUSPENDED";
  rosterApproved: boolean;
}

const base = "/api/v1/admin/launch-roster";

export const listServiceLaunchPolicies = () => apiRequest<LaunchRosterPolicy[]>(`${base}/policies`);
export const listLaunchRosterMembers = (policyId: number) =>
  apiRequest<LaunchRosterPlumber[]>(`${base}/policies/${policyId}/members`);
export const activateLaunchRosterMember = (policyId: number, plumberId: number, reason: string) =>
  apiRequest<LaunchRosterPlumber>(`${base}/policies/${policyId}/members/${plumberId}`, {
    method: "POST",
    body: { reason },
  });
export const deactivateLaunchRosterMember = (policyId: number, plumberId: number, reason: string) =>
  apiRequest<LaunchRosterPlumber>(`${base}/policies/${policyId}/members/${plumberId}/deactivate`, {
    method: "PATCH",
    body: { reason },
  });
