"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { usePortalSession } from "@/components/admin-shell/PortalGate";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import { PLATFORM_ROLES, type PlatformRole } from "@/services/rbacService";
import {
  listUsers,
  updateUserStatus,
  type AdminUserSummary,
  type UserStatus,
  type AdminUserListResponse,
} from "@/services/superAdminService";

const STATUS_OPTIONS: Array<UserStatus | ""> = ["", "ACTIVE", "SUSPENDED", "BLOCKED"];
const PAGE_SIZES = [10, 20, 50];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-IN");
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  if (status === "BLOCKED") return "danger";
  return "neutral";
}

function statusButtonTone(status: UserStatus) {
  if (status === "ACTIVE") return "button-primary";
  if (status === "SUSPENDED") return "button-secondary";
  return "button-danger";
}

export default function UsersPage() {
  const router = useRouter();
  const currentUser = usePortalSession();
  const [data, setData] = useState<AdminUserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<PlatformRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pendingAction, setPendingAction] = useState<string>("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listUsers({
        role: role || undefined,
        status: status || undefined,
        search: search.trim() || undefined,
        page,
        size,
      });
      setData(response);
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [router, role, status, search, page, size]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function updateStatus(user: AdminUserSummary, nextStatus: UserStatus) {
    if (!window.confirm(`Set ${user.fullName} to ${nextStatus}?`)) {
      return;
    }

    const actionKey = `${user.id}-${nextStatus}`;
    setPendingAction(actionKey);
    setError("");
    try {
      await updateUserStatus(user.id, nextStatus);
      await loadUsers();
    } catch (updateError) {
      if (updateError instanceof ApiError && (updateError.status === 401 || updateError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(updateError instanceof Error ? updateError.message : "Unable to update user status");
    } finally {
      setPendingAction("");
    }
  }

  function updateRoleFilter(value: string) {
    setPage(0);
    setRole(value as PlatformRole | "");
  }

  function updateStatusFilter(value: string) {
    setPage(0);
    setStatus(value as UserStatus | "");
  }

  const rows = data?.users ?? [];
  const isSelf = (userId: number) => currentUser?.id === userId;

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">Search, filter, and manage every platform user.</p>
          </div>
          <StatusBadge tone="info">{data ? `${data.totalElements} users` : "Loading"}</StatusBadge>
        </div>

        <div className="toolbar-grid">
          <div className="field">
            <label className="field-label" htmlFor="search">Search</label>
            <input
              id="search"
              className="field-input"
              value={search}
              onChange={(event) => {
                setPage(0);
                setSearch(event.target.value);
              }}
              placeholder="Name, email, or phone"
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="role">Role</label>
            <select
              id="role"
              className="field-input"
              value={role}
              onChange={(event) => updateRoleFilter(event.target.value)}
            >
              <option value="">All roles</option>
              {PLATFORM_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="status">Status</label>
            <select
              id="status"
              className="field-input"
              value={status}
              onChange={(event) => updateStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.filter(Boolean).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="size">Page size</label>
            <select
              id="size"
              className="field-input"
              value={size}
              onChange={(event) => {
                setPage(0);
                setSize(Number(event.target.value));
              }}
            >
              {PAGE_SIZES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <section className="panel">
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Loading users</div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No users found</div>
                  </td>
                </tr>
              ) : (
                rows.map((user) => {
                  const locked = isSelf(user.id);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="row-title">{user.fullName}</div>
                        <div className="row-subtitle">{user.email}</div>
                        <div className="row-subtitle">{user.phone}</div>
                      </td>
                      <td>{user.role.replaceAll("_", " ")}</td>
                      <td>
                        <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastActiveAt)}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="button button-secondary" href={`/users/${user.id}`}>
                            View
                          </Link>
                          <button
                            type="button"
                            className={statusButtonTone("SUSPENDED")}
                            disabled={locked || pendingAction === `${user.id}-SUSPENDED`}
                            onClick={() => void updateStatus(user, "SUSPENDED")}
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            className={statusButtonTone("BLOCKED")}
                            disabled={locked || pendingAction === `${user.id}-BLOCKED`}
                            onClick={() => void updateStatus(user, "BLOCKED")}
                          >
                            Block
                          </button>
                          <button
                            type="button"
                            className={statusButtonTone("ACTIVE")}
                            disabled={locked || pendingAction === `${user.id}-ACTIVE`}
                            onClick={() => void updateStatus(user, "ACTIVE")}
                          >
                            Activate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="page-footer">
          <div className="panel-note">
            Showing {rows.length} of {data?.totalElements ?? 0}
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="button button-secondary"
              disabled={page <= 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
            >
              Previous
            </button>
            <StatusBadge tone="neutral">
              Page {page + 1} of {Math.max(data?.totalPages ?? 1, 1)}
            </StatusBadge>
            <button
              type="button"
              className="button button-secondary"
              disabled={page + 1 >= (data?.totalPages ?? 0)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
