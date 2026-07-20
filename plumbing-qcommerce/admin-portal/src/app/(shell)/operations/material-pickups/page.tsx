/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import {
  adminCancelMaterialRequest,
  adminReassignMaterialRequestStore,
  getAdminMaterialRequest,
  listAdminMaterialRequests,
  type MaterialRequestStatus,
  type OperationsMaterialRequestDetail,
  type OperationsMaterialRequestSummary,
} from "@/services/operationsService";
import { formatDate, statusTone } from "../operationsHelpers";

const materialStatuses: Array<MaterialRequestStatus | ""> = [
  "",
  "REQUESTED",
  "STORE_REVIEWING",
  "APPROVED",
  "PARTIALLY_AVAILABLE",
  "REJECTED",
  "RESERVED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PLUMBER_AT_STORE",
  "COLLECTED",
  "CANCELLED",
];

function currency(amount?: number | null) {
  if (amount == null) return "—";
  return `₹${amount.toFixed(2)}`;
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function DetailPanel({
  detail,
  onClose,
  onReassign,
  onCancel,
}: {
  detail: OperationsMaterialRequestDetail;
  onClose: () => void;
  onReassign: (id: number, storeId: number) => Promise<void>;
  onCancel: (id: number, reason: string) => Promise<void>;
}) {
  const [storeIdInput, setStoreIdInput] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

  const isCancellable = !["COLLECTED", "CANCELLED"].includes(detail.status);

  const handleReassign = async () => {
    const id = parseInt(storeIdInput, 10);
    if (!storeIdInput || isNaN(id)) { setActionError("Enter a valid numeric store ID."); return; }
    setWorking(true);
    setActionError("");
    try {
      await onReassign(detail.requestId, id);
      setStoreIdInput("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reassign failed");
    } finally {
      setWorking(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { setActionError("A cancellation reason is required."); return; }
    setWorking(true);
    setActionError("");
    try {
      await onCancel(detail.requestId, cancelReason);
      setCancelReason("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: "1.5rem" }}>
      <div className="page-header">
        <div>
          <h2 className="panel-title">Request #{detail.requestId} — Detail</h2>
          <p className="page-subtitle">
            {detail.plumberName ?? "Unknown plumber"} · {detail.storeName ?? "Unknown store"}
          </p>
        </div>
        <button className="button button-secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Meta info */}
      <div className="toolbar-grid" style={{ marginTop: "1rem" }}>
        <div className="field">
          <span className="field-label">Status</span>
          <div style={{ marginTop: 4 }}>
            <StatusBadge tone={statusTone(detail.status)}>{detail.status}</StatusBadge>
          </div>
        </div>
        <div className="field">
          <span className="field-label">Customer</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {detail.customerName ?? "—"}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Service Job</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {detail.serviceOrderId ? `#${detail.serviceOrderId}` : "—"}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Total Amount</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {currency(detail.amount)}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Created</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {fmtTime(detail.createdAt)}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Store Confirmed</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {fmtTime(detail.storeConfirmedAt)}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Plumber Arrived</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {fmtTime(detail.plumberArrivedAt)}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Collected At</span>
          <div className="field-input" style={{ background: "transparent", border: "none", padding: 0, marginTop: 4 }}>
            {fmtTime(detail.collectionConfirmedAt)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginTop: "1.5rem" }}>
        <h3 className="panel-title" style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>Items</h3>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Requested</th>
                <th>Reserved</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>{item.requestedQuantity}</td>
                  <td>{item.reservedQuantity}</td>
                  <td>{currency(item.unitPrice)}</td>
                  <td>{currency(item.unitPrice * item.reservedQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status history */}
      {detail.statusHistory.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3 className="panel-title" style={{ marginBottom: "0.75rem", fontSize: "0.9rem" }}>Status History</h3>
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Changed At</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {detail.statusHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td><StatusBadge tone={statusTone(entry.status)}>{entry.status}</StatusBadge></td>
                    <td>{fmtTime(entry.changedAt)}</td>
                    <td>{entry.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin actions */}
      {actionError && <div className="field-error" style={{ marginTop: "1rem" }}>{actionError}</div>}
      <div className="toolbar-grid" style={{ marginTop: "1.5rem" }}>
        {/* Reassign store */}
        <div className="field">
          <label className="field-label">Reassign to Store ID</label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: 4 }}>
            <input
              className="field-input"
              type="number"
              placeholder="Store ID"
              value={storeIdInput}
              onChange={(e) => setStoreIdInput(e.target.value)}
              disabled={working}
            />
            <button
              className="button button-secondary"
              type="button"
              onClick={handleReassign}
              disabled={working}
            >
              Reassign
            </button>
          </div>
        </div>

        {/* Cancel */}
        {isCancellable && (
          <div className="field">
            <label className="field-label">Cancel Request</label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: 4 }}>
              <input
                className="field-input"
                placeholder="Reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={working}
              />
              <button
                className="button"
                style={{ backgroundColor: "var(--color-danger, #ef4444)", color: "#fff" }}
                type="button"
                onClick={handleCancel}
                disabled={working}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaterialPickupsPage() {
  const [items, setItems] = useState<OperationsMaterialRequestSummary[]>([]);
  const [status, setStatus] = useState<MaterialRequestStatus | "">("");
  const [storeId, setStoreId] = useState("");
  const [plumberId, setPlumberId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [error, setError] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<OperationsMaterialRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const page = await listAdminMaterialRequests({ status, storeId: storeId || undefined, plumberId: plumberId || undefined, serviceOrderId: serviceOrderId || undefined, size: 50 });
      setItems(page.content);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load material requests");
    }
  }, [status, storeId, plumberId, serviceOrderId]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const d = await getAdminMaterialRequest(id);
      setSelectedDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReassign = async (id: number, newStoreId: number) => {
    const updated = await adminReassignMaterialRequestStore(id, newStoreId);
    setSelectedDetail(updated);
    await load();
  };

  const handleCancel = async (id: number, reason: string) => {
    const updated = await adminCancelMaterialRequest(id, reason);
    setSelectedDetail(updated);
    await load();
  };

  return (
    <div className="stack">
      {/* Filters */}
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Material Pickup Management</h1>
            <p className="page-subtitle">
              Monitor, reassign stores, and cancel plumber material pickup requests.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <StatusBadge tone="info">{items.length} requests</StatusBadge>
            <button className="button button-secondary" type="button" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="toolbar-grid">
          <div className="field">
            <label className="field-label">Status</label>
            <select
              className="field-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as MaterialRequestStatus | "")}
            >
              {materialStatuses.map((s) => (
                <option key={s || "all"} value={s}>{s || "All statuses"}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Store ID</label>
            <input className="field-input" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="e.g. 3" />
          </div>
          <div className="field">
            <label className="field-label">Plumber ID</label>
            <input className="field-input" value={plumberId} onChange={(e) => setPlumberId(e.target.value)} placeholder="e.g. 12" />
          </div>
          <div className="field">
            <label className="field-label">Service Order ID</label>
            <input className="field-input" value={serviceOrderId} onChange={(e) => setServiceOrderId(e.target.value)} placeholder="e.g. 44" />
          </div>
        </div>

        {error && <div className="field-error">{error}</div>}
      </section>

      {/* Table */}
      <section className="panel">
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Service Job</th>
                <th>Plumber</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.requestId}>
                  <td>#{item.requestId}</td>
                  <td>{item.serviceOrderId ?? "—"}</td>
                  <td>{item.plumberName ?? "—"}</td>
                  <td>{item.customerName ?? "—"}</td>
                  <td>{item.storeName ?? "—"}</td>
                  <td>
                    <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
                  </td>
                  <td>{currency(item.amount)}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => void openDetail(item.requestId)}
                      disabled={detailLoading}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail panel */}
      {detailLoading && (
        <section className="panel">
          <p className="page-subtitle">Loading detail…</p>
        </section>
      )}
      {selectedDetail && (
        <DetailPanel
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onReassign={handleReassign}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
