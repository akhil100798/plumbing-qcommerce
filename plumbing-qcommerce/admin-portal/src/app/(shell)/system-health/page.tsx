"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { ApiError, clearStoredToken } from "@/services/apiClient";
import { getSystemHealth, type SystemHealthResponse } from "@/services/superAdminService";

type HealthTone = "success" | "warning" | "danger" | "neutral";

type HealthItem = {
  label: string;
  value: string;
  tone: HealthTone;
  note: string;
};

function normalizeStatus(status: string | null | undefined) {
  const normalized = (status || "").trim().toUpperCase();
  if (normalized === "UP") {
    return { value: "UP", tone: "success" as const, note: "Dependency responded to the backend health check." };
  }
  if (normalized === "DOWN") {
    return { value: "DOWN", tone: "danger" as const, note: "Dependency reported an unhealthy or failed backend-visible check." };
  }
  return {
    value: "UNKNOWN",
    tone: "warning" as const,
    note: "Service not reachable from current environment.",
  };
}

export default function SystemHealthPage() {
  const router = useRouter();
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getSystemHealth());
    } catch (loadError) {
      if (loadError instanceof ApiError && (loadError.status === 401 || loadError.status === 403)) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Failed to load system health");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const items = useMemo<HealthItem[]>(() => {
    const source = data;
    return [
      { label: "Backend", ...normalizeStatus(source?.backendStatus) },
      { label: "Database", ...normalizeStatus(source?.databaseStatus) },
      { label: "Redis", ...normalizeStatus(source?.redisStatus) },
      { label: "Kafka", ...normalizeStatus(source?.kafkaStatus) },
      { label: "Edge Service", ...normalizeStatus(source?.edgeServiceStatus) },
    ];
  }, [data]);

  const lastChecked = data?.timestamp ? new Date(data.timestamp).toLocaleString("en-IN") : "No successful check yet";
  const hasHealthData = data !== null;

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">System Health</h1>
            <p className="page-subtitle">A backend-visible dependency snapshot for the current admin environment.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => void loadHealth()} disabled={loading}>
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="panel-note">This page reports backend-visible dependency health. UNKNOWN means the dependency could not be reached from the current environment, not necessarily that the service is broken.</div>
        {error ? <div className="field-error">{error}</div> : null}
        <div className="panel-note">Last checked {lastChecked}</div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Dependency Status</h2>
          <StatusBadge tone="info">Backend-visible checks</StatusBadge>
        </div>

        {loading ? (
          <div className="empty-state">Loading system health snapshot</div>
        ) : !hasHealthData ? (
          <div className="empty-state">System health data is not available right now. Try refreshing after backend connectivity is restored.</div>
        ) : (
          <div className="detail-grid">
            {items.map((item) => (
              <div className="detail-card" key={item.label}>
                <div className="panel-header">
                  <div className="detail-label">{item.label}</div>
                  <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                </div>
                <div className="detail-value">{item.note}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Status Notes</h2>
          <StatusBadge tone="neutral">Interpretation</StatusBadge>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <div className="detail-label">UP</div>
            <div className="detail-value">Shown in green when the backend can reach and validate the dependency.</div>
          </div>
          <div className="detail-card">
            <div className="detail-label">DOWN</div>
            <div className="detail-value">Shown in red when the dependency responds as unhealthy or a backend-visible check fails.</div>
          </div>
          <div className="detail-card">
            <div className="detail-label">UNKNOWN</div>
            <div className="detail-value">Shown in yellow when the dependency could not be reached from the current environment.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
