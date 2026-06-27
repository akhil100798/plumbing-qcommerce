"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import StatCard from "@/components/admin-shell/StatCard";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { getOperationsDashboard, listOperationsMaterialRequests, listOperationsProductOrders, listOperationsServiceJobs, type OperationsDashboardResponse, type OperationsMaterialRequestSummary, type OperationsProductOrderSummary, type OperationsServiceJobSummary } from "@/services/operationsService";
import { currency, formatDate, statusTone } from "./operationsHelpers";

export default function OperationsDashboardPage() {
  const [dashboard, setDashboard] = useState<OperationsDashboardResponse | null>(null);
  const [orders, setOrders] = useState<OperationsProductOrderSummary[]>([]);
  const [jobs, setJobs] = useState<OperationsServiceJobSummary[]>([]);
  const [materials, setMaterials] = useState<OperationsMaterialRequestSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, orderData, jobData, materialData] = await Promise.all([
        getOperationsDashboard(),
        listOperationsProductOrders({ size: 5 }),
        listOperationsServiceJobs({ size: 5 }),
        listOperationsMaterialRequests({ size: 5 }),
      ]);
      setDashboard(dashboardData);
      setOrders(orderData.content);
      setJobs(jobData.content);
      setMaterials(materialData.content);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load operations dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = [
    ["Active Product Orders", dashboard?.activeProductOrders ?? 0],
    ["Pending Orders", dashboard?.pendingProductOrders ?? 0],
    ["Packed Orders", dashboard?.packedOrders ?? 0],
    ["Out for Delivery", dashboard?.outForDeliveryOrders ?? 0],
    ["Delayed Orders", dashboard?.delayedOrders ?? 0],
    ["Active Service Jobs", dashboard?.activeServiceJobs ?? 0],
    ["Pending Materials", dashboard?.pendingMaterialRequests ?? 0],
    ["Active Deliveries", dashboard?.activeDeliveries ?? 0],
    ["Available Partners", dashboard?.availableDeliveryPartners ?? 0],
    ["Cancelled Today", dashboard?.cancelledToday ?? 0],
  ] as const;

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Operations Dashboard</h1>
            <p className="page-subtitle">Live orders, service jobs, delivery pressure, and material flow.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void load()}>Refresh</button>
        </div>
        {error ? <div className="field-error">{error}</div> : null}
        <div className="stat-grid">
          {cards.map(([label, value], index) => <StatCard key={label} label={label} value={loading ? "Loading" : value} accent={["#2563eb", "#f59e0b", "#06b6d4", "#8b5cf6", "#f97316"][index % 5]} />)}
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-header"><h2 className="panel-title">Recent Product Orders</h2><Link className="inline-link" href="/operations/orders">View all</Link></div>
          <div className="stack">{orders.map((order) => <div className="live-job-card" key={order.orderId}><div><div className="row-title">#{order.orderId} {order.customerName}</div><div className="row-subtitle">{order.storeName} - {currency(order.totalAmount)} - {formatDate(order.createdAt)}</div></div><StatusBadge tone={order.delayFlag ? "warning" : statusTone(order.status)}>{order.delayFlag ? "DELAYED" : order.status}</StatusBadge></div>)}</div>
        </section>
        <section className="panel">
          <div className="panel-header"><h2 className="panel-title">Recent Service Jobs</h2><Link className="inline-link" href="/operations/service-jobs">View all</Link></div>
          <div className="stack">{jobs.map((job) => <div className="live-job-card" key={job.jobId}><div><div className="row-title">#{job.jobId} {job.customerName}</div><div className="row-subtitle">{job.requestType} - {job.plumberName ?? "Unassigned"} - {formatDate(job.createdAt)}</div></div><StatusBadge tone={job.delayFlag ? "warning" : statusTone(job.status)}>{job.delayFlag ? "DELAYED" : job.status}</StatusBadge></div>)}</div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header"><h2 className="panel-title">Material Requests</h2><Link className="inline-link" href="/operations/material-requests">View all</Link></div>
        <div className="table-shell"><table className="table"><thead><tr><th>Request</th><th>Job</th><th>Plumber</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>{materials.map((item) => <tr key={item.requestId}><td>#{item.requestId}</td><td>{item.serviceOrderId ?? "-"}</td><td>{item.plumberName ?? "-"}</td><td>{item.customerName ?? "-"}</td><td><StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge></td><td>{currency(item.amount)}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
