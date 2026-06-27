"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { cancelOperationsProductOrder, listOperationsProductOrders, reassignDelivery, type OperationsProductOrderSummary, type ProductOrderStatus } from "@/services/operationsService";
import { currency, formatDate, productStatuses, statusTone } from "../operationsHelpers";

export default function OperationsOrdersPage() {
  const [orders, setOrders] = useState<OperationsProductOrderSummary[]>([]);
  const [status, setStatus] = useState<ProductOrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listOperationsProductOrders({ status, search: search.trim() || undefined, storeId: storeId || undefined, page, size: 10 });
      setOrders(response.content);
      setTotalPages(Math.max(response.totalPages, 1));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load product orders");
    } finally {
      setLoading(false);
    }
  }, [status, search, storeId, page]);

  useEffect(() => { void load(); }, [load]);

  async function cancelOrder(orderId: number) {
    const reason = window.prompt("Cancellation reason");
    if (!reason) return;
    await cancelOperationsProductOrder(orderId, reason);
    await load();
  }

  async function reassign(orderId: number) {
    const partner = Number(window.prompt("New delivery partner user ID"));
    if (!partner) return;
    const reason = window.prompt("Reassignment reason") || "Operations reassignment";
    await reassignDelivery(orderId, partner, reason);
    await load();
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header"><div><h1 className="page-title">Product Orders</h1><p className="page-subtitle">Monitor, cancel, and reassign live commerce orders.</p></div><StatusBadge tone="info">{orders.length} shown</StatusBadge></div>
        <div className="toolbar-grid">
          <div className="field"><label className="field-label">Search</label><input className="field-input" value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Customer, phone, store" /></div>
          <div className="field"><label className="field-label">Status</label><select className="field-input" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value as ProductOrderStatus | ""); }}>{productStatuses.map((item) => <option key={item || "all"} value={item}>{item || "All statuses"}</option>)}</select></div>
          <div className="field"><label className="field-label">Store ID</label><input className="field-input" value={storeId} onChange={(event) => { setPage(0); setStoreId(event.target.value); }} placeholder="Optional" /></div>
        </div>
        {error ? <div className="field-error">{error}</div> : null}
      </section>
      <section className="panel">
        <div className="table-shell"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Store</th><th>Total</th><th>Status</th><th>Delivery</th><th>Created</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={8}><div className="empty-state">Loading orders</div></td></tr> : orders.map((order) => <tr key={order.orderId}><td>#{order.orderId}</td><td><div className="row-title">{order.customerName ?? "-"}</div><div className="row-subtitle">{order.customerPhone ?? "-"}</div></td><td>{order.storeName ?? "-"}</td><td>{currency(order.totalAmount)}</td><td><StatusBadge tone={order.delayFlag ? "warning" : statusTone(order.status)}>{order.delayFlag ? "DELAYED" : order.status}</StatusBadge></td><td>{order.deliveryPartnerName ?? "Unassigned"}</td><td>{formatDate(order.createdAt)}</td><td><div className="table-actions"><Link className="button button-secondary" href={`/operations/orders/${order.orderId}`}>View</Link><button className="button button-secondary" onClick={() => void reassign(order.orderId)}>Reassign</button><button className="button button-danger" onClick={() => void cancelOrder(order.orderId)}>Cancel</button></div></td></tr>)}</tbody></table></div>
        <div className="page-footer"><span className="panel-note">Page {page + 1} of {totalPages}</span><div className="page-actions"><button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>Previous</button><button className="button button-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
      </section>
    </div>
  );
}
