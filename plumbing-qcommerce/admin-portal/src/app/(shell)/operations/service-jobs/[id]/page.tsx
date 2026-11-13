/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { getOperationsServiceJob, listEligiblePlumbers, reassignPlumber, type EligiblePlumber, type OperationsServiceJobDetail } from "@/services/operationsService";
import { currency, formatDate, statusTone } from "../../operationsHelpers";

export default function OperationsServiceJobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<OperationsServiceJobDetail | null>(null);
  const [error, setError] = useState("");
  const [plumbers, setPlumbers] = useState<EligiblePlumber[]>([]);
  const [selectedPlumber, setSelectedPlumber] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [loaded, eligible] = await Promise.all([getOperationsServiceJob(params.id), listEligiblePlumbers()]);
      setJob(loaded); setPlumbers(eligible);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load service job");
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function reassign() {
    const plumber = Number(selectedPlumber);
    if (!plumber || !reason.trim()) { setError("Select an eligible plumber and provide a reason."); return; }
    await reassignPlumber(params.id, plumber, reason.trim());
    await load();
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div><h1 className="page-title">Service Job #{params.id}</h1><p className="page-subtitle">Customer, plumber, materials, location, and job lifecycle.</p></div>
          {job ? <StatusBadge tone={job.delayFlag ? "warning" : statusTone(job.status)}>{job.delayFlag ? "DELAYED" : job.status}</StatusBadge> : null}
        </div>
        {error ? <div className="field-error">{error}</div> : null}
          {job && ["PENDING", "ACCEPTED"].includes(job.status) ? <div className="toolbar-grid"><select className="field-input" value={selectedPlumber} onChange={(event) => setSelectedPlumber(event.target.value)}><option value="">Select eligible plumber</option>{plumbers.map((plumber) => <option key={plumber.id} value={plumber.id}>{plumber.name} {plumber.phone ? `(${plumber.phone})` : ""}</option>)}</select><input className="field-input" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Assignment reason" /><button className="button button-secondary" onClick={() => void reassign()}>Assign / Reassign</button></div> : <div className="panel-note">Assignment is unavailable after the job has arrived or entered a terminal/material workflow state.</div>}
      </section>
      {job ? <>
        <section className="panel"><div className="detail-grid"><div className="detail-card"><div className="detail-label">Customer</div><div className="detail-value">{job.customer?.name ?? "-"}<br />{job.customer?.phone ?? "-"}<br />{job.customer?.email ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Plumber</div><div className="detail-value">{job.plumber?.name ?? "Unassigned"}<br />{job.plumber?.phone ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Request</div><div className="detail-value">{job.requestType}<br />{job.description}</div></div><div className="detail-card"><div className="detail-label">Address</div><div className="detail-value">Lat {job.address?.latitude ?? "-"}, Lng {job.address?.longitude ?? "-"}</div></div></div></section>
        <section className="panel"><div className="panel-header"><h2 className="panel-title">Material Requests</h2><span className="panel-note">Created {formatDate(job.createdAt)}</span></div><div className="table-shell"><table className="table"><thead><tr><th>Request</th><th>Store</th><th>Status</th><th>Amount</th></tr></thead><tbody>{job.materialRequests.map((item) => <tr key={item.requestId}><td>#{item.requestId}</td><td>{item.storeName ?? "-"}</td><td><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></td><td>{currency(item.amount)}</td></tr>)}</tbody></table></div></section>
        <section className="panel"><div className="panel-header"><h2 className="panel-title">Assignment History</h2></div><div className="table-shell"><table className="table"><thead><tr><th>Plumber</th><th>Status</th><th>Mode</th><th>Reason</th><th>Created</th></tr></thead><tbody>{(job.assignmentHistory ?? []).map((item) => <tr key={item.id}><td>{item.plumberName ?? "-"}</td><td>{item.status}</td><td>{item.assignmentMode}</td><td>{item.reason ?? "-"}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div></section>
       </> : null}
    </div>
  );
}
