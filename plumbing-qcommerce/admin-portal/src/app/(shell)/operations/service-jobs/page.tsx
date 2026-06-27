/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listOperationsServiceJobs, reassignPlumber, type OperationsServiceJobSummary, type ServiceJobStatus } from "@/services/operationsService";
import { formatDate, serviceStatuses, statusTone } from "../operationsHelpers";

export default function OperationsServiceJobsPage() {
  const [jobs, setJobs] = useState<OperationsServiceJobSummary[]>([]);
  const [status, setStatus] = useState<ServiceJobStatus | "">("");
  const [search, setSearch] = useState("");
  const [plumberId, setPlumberId] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await listOperationsServiceJobs({ status, search: search.trim() || undefined, plumberId: plumberId || undefined, page, size: 10 });
      setJobs(response.content);
      setTotalPages(Math.max(response.totalPages, 1));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load service jobs");
    }
  }, [status, search, plumberId, page]);

  useEffect(() => { void load(); }, [load]);

  async function reassign(jobId: number) {
    const plumber = Number(window.prompt("New plumber user ID"));
    if (!plumber) return;
    const reason = window.prompt("Reassignment reason") || "Operations reassignment";
    await reassignPlumber(jobId, plumber, reason);
    await load();
  }

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Service Jobs</h1><p className="page-subtitle">Track plumber jobs, delayed work, and reassignment needs.</p></div><StatusBadge tone="info">{jobs.length} shown</StatusBadge></div><div className="toolbar-grid"><div className="field"><label className="field-label">Search</label><input className="field-input" value={search} onChange={(event) => { setPage(0); setSearch(event.target.value); }} placeholder="Customer, phone, description" /></div><div className="field"><label className="field-label">Status</label><select className="field-input" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value as ServiceJobStatus | ""); }}>{serviceStatuses.map((item) => <option key={item || "all"} value={item}>{item || "All statuses"}</option>)}</select></div><div className="field"><label className="field-label">Plumber ID</label><input className="field-input" value={plumberId} onChange={(event) => { setPage(0); setPlumberId(event.target.value); }} placeholder="Optional" /></div></div>{error ? <div className="field-error">{error}</div> : null}</section><section className="panel"><div className="table-shell"><table className="table"><thead><tr><th>Job</th><th>Customer</th><th>Plumber</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.jobId}><td>#{job.jobId}</td><td><div className="row-title">{job.customerName ?? "-"}</div><div className="row-subtitle">{job.customerPhone ?? "-"}</div></td><td><div className="row-title">{job.plumberName ?? "Unassigned"}</div><div className="row-subtitle">{job.plumberPhone ?? "-"}</div></td><td>{job.requestType ?? "-"}</td><td><StatusBadge tone={job.delayFlag ? "warning" : statusTone(job.status)}>{job.delayFlag ? "DELAYED" : job.status}</StatusBadge></td><td>{formatDate(job.createdAt)}</td><td><div className="table-actions"><Link className="button button-secondary" href={`/operations/service-jobs/${job.jobId}`}>View</Link><button className="button button-secondary" onClick={() => void reassign(job.jobId)}>Reassign</button></div></td></tr>)}</tbody></table></div><div className="page-footer"><span className="panel-note">Page {page + 1} of {totalPages}</span><div className="page-actions"><button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>Previous</button><button className="button button-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div></section></div>;
}
