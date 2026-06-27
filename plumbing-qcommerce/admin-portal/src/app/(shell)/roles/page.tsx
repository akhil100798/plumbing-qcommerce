"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import {
  getCurrentAdminAccess,
  getRolePermissions,
  listPermissions,
  listRoles,
  type CurrentAdminAccess,
  type PermissionValue,
  type PlatformRole,
  type RolePermissionResponse,
} from "@/services/rbacService";

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionValue[]>([]);
  const [selectedRole, setSelectedRole] = useState<PlatformRole | "">("");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<RolePermissionResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentAdminAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roleList, permissionList, me] = await Promise.all([
        listRoles(),
        listPermissions(),
        getCurrentAdminAccess(),
      ]);
      setRoles(roleList);
      setPermissions(permissionList);
      setCurrentUser(me);
      const initialRole = (roleList[0] || "SUPER_ADMIN") as PlatformRole;
      setSelectedRole(initialRole);
      setSelectedRolePermissions(await getRolePermissions(initialRole));
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load RBAC data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  async function selectRole(role: PlatformRole) {
    setSelectedRole(role);
    setSelectedRolePermissions(await getRolePermissions(role));
  }

  const selectedPermissions = useMemo(() => selectedRolePermissions?.permissions ?? [], [selectedRolePermissions]);

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Roles & Permissions</h1>
            <p className="page-subtitle">Phase 1 RBAC foundation, surfaced for the Super Admin team.</p>
          </div>
          <StatusBadge tone="info">{currentUser ? roleLabel(currentUser.role) : "Loading"}</StatusBadge>
        </div>

        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Roles</h2>
            <StatusBadge tone="neutral">{roles.length}</StatusBadge>
          </div>

          <div className="stack">
            {loading ? (
              <div className="empty-state">Loading roles...</div>
            ) : (
              roles.map((role) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    className={active ? "button button-primary button-block" : "button button-secondary button-block"}
                    onClick={() => void selectRole(role)}
                  >
                    {roleLabel(role)}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">{selectedRole ? roleLabel(selectedRole) : "Permissions"}</h2>
            <StatusBadge tone="info">{selectedPermissions.length}</StatusBadge>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-label">Permissions</div>
              <div className="chip-row">
                {selectedPermissions.map((permission) => (
                  <StatusBadge key={permission} tone="neutral">
                    {permission}
                  </StatusBadge>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-label">Assignment note</div>
              <div className="detail-value">
                Only SUPER_ADMIN and ADMIN can manage role assignment. SUPER_ADMIN can assign any role. ADMIN can assign
                administrative roles, but cannot assign SUPER_ADMIN.
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-label">All Permissions</div>
              <div className="chip-row">
                {permissions.map((permission) => (
                  <StatusBadge key={permission} tone="info">
                    {permission}
                  </StatusBadge>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
