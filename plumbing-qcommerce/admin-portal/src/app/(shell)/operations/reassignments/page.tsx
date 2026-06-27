"use client";

import { useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { reassignDelivery, reassignPlumber } from "@/services/operationsService";

export default function OperationsReassignmentsPage() {
  const [jobId, setJobId] = useState("");
  const [plumberId, setPlumberId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [deliveryPartnerId, setDeliveryPartnerId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitPlumber() {
    setError(""); setMessage("");
    try { await reassignPlumber(jobId, Number(plumberId), reason); setMessage("Plumber reassigned successfully."); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to reassign plumber"); }
  }

  async function submitDelivery() {
    setError(""); setMessage("");
    try { await reassignDelivery(orderId, Number(deliveryPartnerId), reason); setMessage("Delivery partner reassigned successfully."); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to reassign delivery partner"); }
  }

  const disabled = !reason.trim();

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Reassignments</h1><p className="page-subtitle">Guided actions for stuck jobs and delayed deliveries. Reason is required.</p></div><StatusBadge tone="info">Operations action</StatusBadge></div>{message ? <StatusBadge tone="success">{message}</StatusBadge> : null}{error ? <div className="field-error">{error}</div> : null}</section><div className="two-col"><section className="panel"><div className="panel-header"><h2 className="panel-title">Reassign Plumber</h2></div><div className="stack"><div className="field"><label className="field-label">Service Job ID</label><input className="field-input" value={jobId} onChange={(event) => setJobId(event.target.value)} /></div><div className="field"><label className="field-label">New Plumber ID</label><input className="field-input" value={plumberId} onChange={(event) => setPlumberId(event.target.value)} /></div><button className="button button-primary" disabled={disabled || !jobId || !plumberId} onClick={() => void submitPlumber()}>Submit plumber reassignment</button></div></section><section className="panel"><div className="panel-header"><h2 className="panel-title">Reassign Delivery Partner</h2></div><div className="stack"><div className="field"><label className="field-label">Product Order ID</label><input className="field-input" value={orderId} onChange={(event) => setOrderId(event.target.value)} /></div><div className="field"><label className="field-label">New Delivery Partner ID</label><input className="field-input" value={deliveryPartnerId} onChange={(event) => setDeliveryPartnerId(event.target.value)} /></div><button className="button button-primary" disabled={disabled || !orderId || !deliveryPartnerId} onClick={() => void submitDelivery()}>Submit delivery reassignment</button></div></section></div><section className="panel"><div className="field"><label className="field-label">Reason</label><textarea className="field-input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this reassignment required?" /></div></section></div>;
}
