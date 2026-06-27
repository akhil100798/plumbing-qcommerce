/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { approveRefund, listRefunds, rejectRefund, type RefundSummary } from "@/services/financeService";
import { currency, financeTone, formatDate } from "../financeHelpers";

export default function RefundsPage() {
  const [rows, setRows] = useState<RefundSummary[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await listRefunds({ status, search, size: 50 });
    setRows(response.content);
  }, [status, search]);

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load refunds"));
  }, [load]);

  async function act(id: number, type: "approve" | "reject") {
    if (!note.trim()) {
      setError("Finance note is required");
      return;
    }
    setError("");
    if (type === "approve") {
      await approveRefund(id, note);
    } else {
      await rejectRefund(id, note);
    }
    setNote("");
    await load();
  }

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Refunds</h1><p className="page-subtitle">Review, approve, or reject customer refund requests.</p></div><StatusBadge tone="warning">Note required</StatusBadge></div><div className="toolbar-grid"><div className="field"><label className="field-label">Status</label><select className="field-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>PROCESSED</option></select></div><div className="field"><label className="field-label">Search</label><input className="field-input" value={search} onChange={(event) => setSearch(event.target.value)}/></div><div className="field"><label className="field-label">Finance Note</label><input className="field-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required before action"/></div></div>{error?<div className="field-error">{error}</div>:null}</section><section className="panel"><div className="table-shell"><table className="table"><thead><tr><th>Refund</th><th>Order</th><th>Customer</th><th>Amount</th><th>Reason</th><th>Status</th><th>Requested</th><th>Actions</th></tr></thead><tbody>{rows.map((refund)=><tr key={refund.refundId}><td>#{refund.refundId}</td><td>{refund.orderId}</td><td>{refund.customerName}</td><td>{currency(refund.amount)}</td><td>{refund.reason}</td><td><StatusBadge tone={financeTone(refund.status)}>{refund.status}</StatusBadge></td><td>{formatDate(refund.requestedAt)}</td><td><div className="table-actions"><button className="button button-primary" disabled={refund.status!=="PENDING"} onClick={()=>void act(refund.refundId,"approve")}>Approve</button><button className="button button-danger" disabled={refund.status!=="PENDING"} onClick={()=>void act(refund.refundId,"reject")}>Reject</button></div></td></tr>)}</tbody></table></div></section></div>;
}