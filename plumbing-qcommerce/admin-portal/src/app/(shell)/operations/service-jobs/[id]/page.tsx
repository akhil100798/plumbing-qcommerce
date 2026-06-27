/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { getOperationsServiceJob, reassignPlumber, type OperationsServiceJobDetail } from "@/services/operationsService";
import { currency, formatDate, statusTone } from "../../operationsHelpers";

export default function OperationsServiceJobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<OperationsServiceJobDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setJob(await getOperationsServiceJob(params.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load service job");
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function reassign() {
    const plumber = Number(window.prompt("New plumber user ID"));
    if (!plumber) return;
    const reason = window.prompt("Reassignment reason") || "Operations reassignment";
    await reassignPlumber(params.id, plumber, reason);
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
        <button className="button button-secondary" onClick={() => void reassign()}>Reassign Plumber</button>
      </section>
      {job ? <>
        <section className="panel"><div className="detail-grid"><div className="detail-card"><div className="detail-label">Customer</div><div className="detail-value">{job.customer?.name ?? "-"}<br />{job.customer?.phone ?? "-"}<br />{job.customer?.email ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Plumber</div><div className="detail-value">{job.plumber?.name ?? "Unassigned"}<br />{job.plumber?.phone ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Request</div><div className="detail-value">{job.requestType}<br />{job.description}</div></div><div className="detail-card"><div className="detail-label">Address</div><div className="detail-value">Lat {job.address?.latitude ?? "-"}, Lng {job.address?.longitude ?? "-"}</div></div></div></section>
        <section className="panel"><div className="panel-header"><h2 className="panel-title">Material Requests</h2><span className="panel-note">Created {formatDate(job.createdAt)}</span></div><div className="table-shell"><table className="table"><thead><tr><th>Request</th><th>Store</th><th>Status</th><th>Amount</th></tr></thead><tbody>{job.materialRequests.map((item) => <tr key={item.requestId}><td>#{item.requestId}</td><td>{item.storeName ?? "-"}</td><td><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></td><td>{currency(item.amount)}</td></tr>)}</tbody></table></div></section>
      </> : null}
    </div>
  );
}