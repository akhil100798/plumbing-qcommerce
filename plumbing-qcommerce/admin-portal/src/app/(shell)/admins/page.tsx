"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import { ADMIN_ROLES } from "@/services/rbacService";
import { listAdminUsers, type AdminUserSummary, type AdminUserListResponse } from "@/services/superAdminService";

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "BLOCKED") return "danger";
  return "neutral";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await listAdminUsers());
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const groups = useMemo(() => {
    const output = new Map<string, AdminUserSummary[]>();
    ADMIN_ROLES.forEach((role) => output.set(role, []));
    data?.users.forEach((user) => {
      const current = output.get(user.role) || [];
      current.push(user);
      output.set(user.role, current);
    });
    return output;
  }, [data]);

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Users</h1>
            <p className="page-subtitle">A grouped view of privileged accounts across the platform.</p>
          </div>
          <StatusBadge tone="info">{data ? `${data.totalElements} accounts` : "Loading"}</StatusBadge>
        </div>

        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <div className="stat-grid">
        {ADMIN_ROLES.map((role) => (
          <article key={role} className="panel">
            <div className="panel-header">
              <h2 className="panel-title">{roleLabel(role)}</h2>
              <StatusBadge tone="neutral">{groups.get(role)?.length ?? 0}</StatusBadge>
            </div>

            <div className="stack">
              {loading ? (
                <div className="empty-state">Loading...</div>
              ) : (groups.get(role)?.length ?? 0) === 0 ? (
                <div className="empty-state">No users in this role</div>
              ) : (
                groups.get(role)?.map((user) => (
                  <div key={user.id} className="detail-card">
                    <div className="row-title">{user.fullName}</div>
                    <div className="row-subtitle">{user.email}</div>
                    <div className="table-actions">
                      <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                      <StatusBadge tone="info">{user.phone}</StatusBadge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
