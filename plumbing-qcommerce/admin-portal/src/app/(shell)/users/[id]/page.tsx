"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { usePortalSession } from "@/components/admin-shell/PortalGate";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import { getUser, updateUserStatus, type AdminUserDetailResponse, type UserStatus } from "@/services/superAdminService";

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

export default function UserDetailPage() {
  const router = useRouter();
  const currentUser = usePortalSession();
  const params = useParams<{ id: string }>();
  const userId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<UserStatus | "">("");

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await getUser(id);
      setData(response);
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void loadDetail(userId);
  }, [loadDetail, userId]);

  async function changeStatus(nextStatus: UserStatus) {
    if (!data) return;
    if (!window.confirm(`Set ${data.fullName} to ${nextStatus}?`)) return;
    setPendingAction(nextStatus);
    try {
      const response = await updateUserStatus(data.id, nextStatus);
      setData(response);
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

  const isSelf = currentUser?.id === data?.id;

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <Link className="inline-link" href="/users">
              Back to users
            </Link>
            <h1 className="page-title">{loading ? "Loading user" : data?.fullName ?? "User details"}</h1>
            <p className="page-subtitle">{data?.email ?? "User profile and activity summary"}</p>
          </div>
          {data ? <StatusBadge tone={statusTone(data.status)}>{data.status}</StatusBadge> : null}
        </div>

        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <section className="detail-grid">
        <div className="detail-card">
          <div className="detail-label">Basic Profile</div>
          <div className="detail-row">
            <span className="detail-key">Email</span>
            <span className="detail-value">{data?.email ?? "-"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Phone</span>
            <span className="detail-value">{data?.phone ?? "-"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Role</span>
            <span className="detail-value">{data?.role?.replaceAll("_", " ") ?? "-"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Status</span>
            <span className="detail-value">{data?.status ?? "-"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Created</span>
            <span className="detail-value">{formatDate(data?.createdAt)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Updated</span>
            <span className="detail-value">{formatDate(data?.updatedAt)}</span>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-label">Activity Summary</div>
          <div className="detail-row">
            <span className="detail-key">Product Orders</span>
            <span className="detail-value">{data?.activitySummary?.productOrders ?? 0}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Service Jobs</span>
            <span className="detail-value">{data?.activitySummary?.serviceJobs ?? 0}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Deliveries</span>
            <span className="detail-value">{data?.activitySummary?.deliveries ?? 0}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Managed Stores</span>
            <span className="detail-value">{data?.activitySummary?.managedStores ?? 0}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Last Active</span>
            <span className="detail-value">{formatDate(data?.lastActiveAt)}</span>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-label">Related Link</div>
          {data?.linkedStore ? (
            <>
              <div className="detail-row">
                <span className="detail-key">Store</span>
                <span className="detail-value">{data.linkedStore.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Address</span>
                <span className="detail-value">{data.linkedStore.address}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">No linked store available</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Admin Actions</h2>
          <StatusBadge tone="info">Status control</StatusBadge>
        </div>

        <div className="table-actions">
          <button
            type="button"
            className="button button-primary"
            disabled={!data || isSelf || pendingAction === "ACTIVE"}
            onClick={() => void changeStatus("ACTIVE")}
          >
            Activate
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={!data || isSelf || pendingAction === "SUSPENDED"}
            onClick={() => void changeStatus("SUSPENDED")}
          >
            Suspend
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={!data || isSelf || pendingAction === "BLOCKED"}
            onClick={() => void changeStatus("BLOCKED")}
          >
            Block
          </button>
        </div>

        {isSelf ? <div className="panel-note">You cannot change your own status.</div> : null}
      </section>
    </div>
  );
}
