/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listOperationsProductOrders, listOperationsServiceJobs, type OperationsProductOrderSummary, type OperationsServiceJobSummary } from "@/services/operationsService";
import { formatDate, statusTone } from "../operationsHelpers";

export default function OperationsDelayedPage() {
  const [orders, setOrders] = useState<OperationsProductOrderSummary[]>([]);
  const [jobs, setJobs] = useState<OperationsServiceJobSummary[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [orderData, jobData] = await Promise.all([listOperationsProductOrders({ size: 100 }), listOperationsServiceJobs({ size: 100 })]);
      setOrders(orderData.content.filter((item) => item.delayFlag));
      setJobs(jobData.content.filter((item) => item.delayFlag));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load delayed items"); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Delayed Orders</h1><p className="page-subtitle">Operationally delayed product orders and service jobs.</p></div><StatusBadge tone="warning">{orders.length + jobs.length} delayed</StatusBadge></div>{error ? <div className="field-error">{error}</div> : null}</section><section className="panel"><div className="panel-header"><h2 className="panel-title">Delayed Product Orders</h2></div><div className="table-shell"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody>{orders.map((order) => <tr key={order.orderId}><td>#{order.orderId}</td><td>{order.customerName ?? "-"}</td><td><StatusBadge tone={statusTone(order.status)}>{order.status}</StatusBadge></td><td>ETA breached or older than SLA - {formatDate(order.createdAt)}</td><td><Link className="button button-secondary" href={`/operations/orders/${order.orderId}`}>Open</Link></td></tr>)}</tbody></table></div></section><section className="panel"><div className="panel-header"><h2 className="panel-title">Delayed Service Jobs</h2></div><div className="table-shell"><table className="table"><thead><tr><th>Job</th><th>Customer</th><th>Status</th><th>Reason</th><th>Action</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.jobId}><td>#{job.jobId}</td><td>{job.customerName ?? "-"}</td><td><StatusBadge tone={statusTone(job.status)}>{job.status}</StatusBadge></td><td>Older than service SLA - {formatDate(job.createdAt)}</td><td><Link className="button button-secondary" href={`/operations/service-jobs/${job.jobId}`}>Open</Link></td></tr>)}</tbody></table></div></section></div>;
}
