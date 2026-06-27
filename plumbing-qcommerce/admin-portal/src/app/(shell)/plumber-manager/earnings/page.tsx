"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listPlumbers, type PlumberSummary } from "@/services/plumberManagerService";
import { money } from "../plumberHelpers";

export default function PlumberEarningsPage() {
  const [rows, setRows] = useState<PlumberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const response = await listPlumbers({ size: 100 });
      setRows(response.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load plumber earnings");
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
          <h1 className="page-title">Plumber Earnings</h1>
          <p className="page-subtitle">Gross earnings are derived from completed service jobs. Finance settlement integration is still pending for payout details.</p>
        </div>
      </div>
      <div className="panel-note">Commission, net payout, and settlement states remain unavailable until finance settlement integration is completed.</div>
      {error ? <div className="field-error">{error}</div> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plumber</th>
              <th>Completed Jobs</th>
              <th>Gross Earnings</th>
              <th>Commission</th>
              <th>Net Payout</th>
              <th>Settlement</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}><div className="empty-state">Loading plumber earnings</div></td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6}><div className="empty-state">No plumber earnings data available yet</div></td>
              </tr>
            ) : rows.map((plumber) => (
              <tr key={plumber.plumberId}>
                <td><Link className="inline-link" href={`/plumber-manager/plumbers/${plumber.plumberId}`}>{plumber.fullName}</Link></td>
                <td>{plumber.completedJobs}</td>
                <td>{money(plumber.totalEarnings)}</td>
                <td><StatusBadge tone="warning">Commission not available</StatusBadge></td>
                <td><StatusBadge tone="warning">Net payout not calculated yet</StatusBadge></td>
                <td><StatusBadge tone="info">Settlement integration pending</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
