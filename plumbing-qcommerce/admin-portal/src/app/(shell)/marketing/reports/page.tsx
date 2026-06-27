"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { reports } from "@/services/marketingService";
import { money } from "../helpers";

type MarketingReportData = Record<string, number | string>;

function labelize(key: string) {
  return key.replaceAll(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase()).trim();
}

function isEstimatedMetric(key: string) {
  const normalized = key.toLowerCase();
  return normalized.includes("usage") || normalized.includes("discount") || normalized.includes("estimate") || normalized.includes("conversion") || normalized.includes("rate");
}

function formatValue(key: string, value: number | string) {
  const normalized = key.toLowerCase();
  if (typeof value === "number" && (normalized.includes("discount") || normalized.includes("revenue") || normalized.includes("amount"))) {
    return money(value);
  }
  return value;
}

export default function MarketingReportsPage() {
  const [report, setReport] = useState<MarketingReportData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const metrics = useMemo(() => Object.entries(report), [report]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      setReport(await reports());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load marketing reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing Reports</h1>
          <p className="page-subtitle">Use these metrics for admin visibility, not audited finance reporting.</p>
        </div>
      </div>
      <div className="panel-note">Coupon usage, discount given, and other computed promotion metrics are estimated from available admin data.</div>
      {error ? <div className="field-error">{error}</div> : null}
      {loading ? (
        <div className="empty-state">Loading marketing reports</div>
      ) : metrics.length === 0 ? (
        <div className="empty-state">No report metrics available yet</div>
      ) : (
        <div className="detail-grid">
          {metrics.map(([key, value]) => (
            <div className="detail-card" key={key}>
              <div className="panel-header">
                <div className="detail-label">{labelize(key)}</div>
                {isEstimatedMetric(key) ? <StatusBadge tone="warning">Estimated</StatusBadge> : null}
              </div>
              <div className="detail-value">{formatValue(key, value)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
