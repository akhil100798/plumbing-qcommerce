"use client";

import { useEffect, useState } from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

import StatCard from "@/components/admin-shell/StatCard";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import { getDashboard, type SuperAdminDashboardResponse } from "@/services/superAdminService";

const statAccentColors = [
  "#2563eb",
  "#0f766e",
  "#7c3aed",
  "#f59e0b",
  "#dc2626",
  "#14b8a6",
  "#2563eb",
  "#0f766e",
  "#7c3aed",
  "#f59e0b",
  "#dc2626",
];

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncedAt, setSyncedAt] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDashboard();
      setDashboard(response);
      setSyncedAt(new Date().toLocaleString("en-IN"));
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    ["Customers", dashboard?.totalCustomers ?? 0, "Registered buyers"],
    ["Plumbers", dashboard?.totalPlumbers ?? 0, "Trade accounts"],
    ["Stores", dashboard?.totalStores ?? 0, "Managed locations"],
    ["Delivery Partners", dashboard?.totalDeliveryPartners ?? 0, "Logistics users"],
    ["Admin Users", dashboard?.totalAdmins ?? 0, "Privileged operators"],
    ["Product Orders", dashboard?.totalProductOrders ?? 0, "Commerce orders"],
    ["Service Orders", dashboard?.totalServiceOrders ?? 0, "Job requests"],
    ["Revenue", dashboard ? currency(dashboard.totalRevenue) : "Rs 0", "Completed value"],
    ["Pending Orders", dashboard?.pendingOrders ?? 0, "Orders awaiting action"],
    ["Active Jobs", dashboard?.activeServiceJobs ?? 0, "Jobs in motion"],
  ] as const;

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Platform Overview</h1>
            <p className="page-subtitle">A clean read on the platform core and its current load.</p>
          </div>
          <div className="page-actions">
            <StatusBadge tone={loading ? "neutral" : "success"}>{loading ? "Refreshing" : "Live"}</StatusBadge>
            <button type="button" className="button button-secondary" onClick={() => void loadDashboard()}>
              Refresh
            </button>
          </div>
        </div>

        {error ? <div className="field-error">{error}</div> : null}
        {syncedAt ? <div className="panel-note">Last synced {syncedAt}</div> : null}

        <div className="stat-grid">
          {statCards.map(([label, value, hint], index) => (
            <StatCard
              key={label}
              label={label}
              value={loading ? "Loading" : value}
              hint={hint}
              accent={statAccentColors[index]}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Operational Mix</h2>
          <StatusBadge tone="info">Summary</StatusBadge>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-label">User Base</div>
            <div className="detail-value">
              {dashboard?.totalCustomers ?? 0} customers and {dashboard?.totalPlumbers ?? 0} plumbers
            </div>
          </div>
          <div className="detail-card">
            <div className="detail-label">Activity</div>
            <div className="detail-value">
              {dashboard?.pendingOrders ?? 0} pending orders and {dashboard?.activeServiceJobs ?? 0} active jobs
            </div>
          </div>
          <div className="detail-card">
            <div className="detail-label">Revenue</div>
            <div className="detail-value">{dashboard ? currency(dashboard.totalRevenue) : "Loading"}</div>
          </div>
          <div className="detail-card">
            <div className="detail-label">Support Load</div>
            <div className="detail-value">
              {dashboard?.pendingMaterialRequests ?? 0} material requests awaiting review
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
