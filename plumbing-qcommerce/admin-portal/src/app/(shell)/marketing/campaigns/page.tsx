"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { campaignStatus, campaigns, createCampaign, type Campaign } from "@/services/marketingService";
import { tone } from "../helpers";

export default function CampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const response = await campaigns();
      setRows(response.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(campaignId: number, nextStatus: string) {
    try {
      setError("");
      await campaignStatus(campaignId, nextStatus);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update campaign status");
    }
  }

  async function createDraft() {
    if (!name.trim()) {
      setError("Campaign name is required before creating a draft.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      await createCampaign({ name: name.trim(), campaignType: "PUSH", targetSegment: "CUSTOMERS" });
      setName("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create campaign draft");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Campaigns</h1>
            <p className="page-subtitle">Track campaign records and lifecycle changes with demo-safe admin reporting.</p>
          </div>
          <StatusBadge tone="info">Demo Tracking</StatusBadge>
        </div>
        <div className="panel-note">Campaign statuses are recorded here for operational review. Attribution and downstream delivery analytics remain limited to available admin data.</div>
        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Segment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}><div className="empty-state">Loading campaigns</div></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}><div className="empty-state">No campaign drafts or live campaigns yet</div></td>
                </tr>
              ) : rows.map((campaignRow) => (
                <tr key={campaignRow.campaignId}>
                  <td><Link className="inline-link" href={`/marketing/campaigns/${campaignRow.campaignId}`}>{campaignRow.name}</Link></td>
                  <td>{campaignRow.campaignType}</td>
                  <td>{campaignRow.targetSegment}</td>
                  <td><StatusBadge tone={tone(campaignRow.status)}>{campaignRow.status}</StatusBadge></td>
                  <td>
                    {campaignRow.status === "ACTIVE" ? (
                      <button className="button button-secondary" onClick={() => void updateStatus(campaignRow.campaignId, "PAUSED")}>Pause</button>
                    ) : campaignRow.status === "PAUSED" ? (
                      <button className="button button-primary" onClick={() => void updateStatus(campaignRow.campaignId, "ACTIVE")}>Resume</button>
                    ) : campaignRow.status === "DRAFT" ? (
                      <button className="button button-primary" onClick={() => void updateStatus(campaignRow.campaignId, "ACTIVE")}>Activate</button>
                    ) : (
                      <StatusBadge tone="neutral">No transition</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Create Campaign Draft</h2>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="campaign-name">Campaign name</label>
          <input id="campaign-name" className="field-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Monsoon retention reminder" />
        </div>
        <div className="panel-note">New drafts use the current demo defaults: campaign type `PUSH` and target segment `CUSTOMERS`.</div>
        <div className="page-actions">
          <button className="button button-primary" onClick={() => void createDraft()} disabled={creating}>
            {creating ? "Creating draft" : "Create draft"}
          </button>
        </div>
      </section>
    </div>
  );
}
