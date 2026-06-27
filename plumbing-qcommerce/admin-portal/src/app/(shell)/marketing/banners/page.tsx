"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { banners, createBanner, toggleBanner, type Banner } from "@/services/marketingService";
import { tone } from "../helpers";

const placements = ["CUSTOMER_HOME", "CUSTOMER_CATEGORY", "PLUMBER_HOME"];

export default function BannersPage() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [placement, setPlacement] = useState(placements[0]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      setRows(await banners());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createRecord() {
    if (!title.trim()) {
      setError("Banner title is required before creating a record.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      await createBanner({ title: title.trim(), placement });
      setTitle("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create banner record");
    } finally {
      setCreating(false);
    }
  }

  async function toggle(bannerId: number, nextActive: boolean) {
    try {
      setError("");
      await toggleBanner(bannerId, nextActive);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update banner status");
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Promotional Banners</h1>
            <p className="page-subtitle">Manage banner records and activation state for admin workflows.</p>
          </div>
        </div>
        <div className="panel-note">Banner records are managed here; rendering inside mobile apps requires separate mobile integration.</div>
        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Placement</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4}><div className="empty-state">Loading banners</div></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4}><div className="empty-state">No banner records yet</div></td>
                </tr>
              ) : rows.map((bannerRow) => (
                <tr key={bannerRow.bannerId}>
                  <td>{bannerRow.title}</td>
                  <td><StatusBadge tone="info">{bannerRow.placement}</StatusBadge></td>
                  <td><StatusBadge tone={tone(bannerRow.active ? "ACTIVE" : "PAUSED")}>{bannerRow.active ? "ACTIVE" : "INACTIVE"}</StatusBadge></td>
                  <td>
                    <button className="button button-secondary" onClick={() => void toggle(bannerRow.bannerId, !bannerRow.active)}>
                      {bannerRow.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Create Banner</h2>
        </div>
        <div className="toolbar-grid">
          <div className="field">
            <label className="field-label" htmlFor="banner-title">Banner title</label>
            <input id="banner-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Weekend tool spotlight" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="banner-placement">Placement</label>
            <select id="banner-placement" className="field-input" value={placement} onChange={(event) => setPlacement(event.target.value)}>
              {placements.map((placementOption) => <option key={placementOption} value={placementOption}>{placementOption}</option>)}
            </select>
          </div>
        </div>
        <div className="page-actions">
          <button className="button button-primary" onClick={() => void createRecord()} disabled={creating}>
            {creating ? "Creating banner" : "Create banner"}
          </button>
        </div>
      </section>
    </div>
  );
}
