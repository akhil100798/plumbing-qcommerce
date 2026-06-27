/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listOperationsMaterialRequests, type OperationsMaterialRequestSummary, type ProductOrderStatus } from "@/services/operationsService";
import { currency, formatDate, productStatuses, statusTone } from "../operationsHelpers";

export default function OperationsMaterialRequestsPage() {
  const [items, setItems] = useState<OperationsMaterialRequestSummary[]>([]);
  const [status, setStatus] = useState<ProductOrderStatus | "">("");
  const [plumberId, setPlumberId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setItems((await listOperationsMaterialRequests({ status, plumberId: plumberId || undefined, orderId: orderId || undefined, size: 50 })).content); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load material requests"); }
  }, [status, plumberId, orderId]);

  useEffect(() => { void load(); }, [load]);

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Material Requests</h1><p className="page-subtitle">Material orders raised from active plumber jobs.</p></div><StatusBadge tone="info">{items.length} requests</StatusBadge></div><div className="toolbar-grid"><div className="field"><label className="field-label">Status</label><select className="field-input" value={status} onChange={(event) => setStatus(event.target.value as ProductOrderStatus | "")}>{productStatuses.map((item) => <option key={item || "all"} value={item}>{item || "All statuses"}</option>)}</select></div><div className="field"><label className="field-label">Plumber ID</label><input className="field-input" value={plumberId} onChange={(event) => setPlumberId(event.target.value)} /></div><div className="field"><label className="field-label">Service Order ID</label><input className="field-input" value={orderId} onChange={(event) => setOrderId(event.target.value)} /></div></div>{error ? <div className="field-error">{error}</div> : null}</section><section className="panel"><div className="table-shell"><table className="table"><thead><tr><th>Request</th><th>Service Job</th><th>Plumber</th><th>Customer</th><th>Store</th><th>Status</th><th>Amount</th><th>Created</th></tr></thead><tbody>{items.map((item) => <tr key={item.requestId}><td>#{item.requestId}</td><td>{item.serviceOrderId ?? "-"}</td><td>{item.plumberName ?? "-"}</td><td>{item.customerName ?? "-"}</td><td>{item.storeName ?? "-"}</td><td><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></td><td>{currency(item.amount)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></section></div>;
}
