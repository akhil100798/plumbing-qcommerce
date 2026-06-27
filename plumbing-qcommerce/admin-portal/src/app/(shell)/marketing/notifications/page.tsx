"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { notices, sendNotice, type Notice } from "@/services/marketingService";
import { tone } from "../helpers";

export default function NotificationsPage() {
  const [rows, setRows] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(() => title.trim().length > 0 && message.trim().length > 0, [title, message]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      setRows(await notices());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load notification history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitNotification() {
    if (!canSend) {
      setError("Title and message are required before saving a demo notification.");
      return;
    }

    try {
      setSending(true);
      setError("");
      await sendNotice({ title: title.trim(), message: message.trim(), targetSegment: "CUSTOMERS" });
      setTitle("");
      setMessage("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save notification record");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Push Notifications</h1>
            <p className="page-subtitle">Create demo notification records for admin review without claiming live delivery.</p>
          </div>
          <StatusBadge tone="warning">Demo Send Only</StatusBadge>
        </div>
        <div className="panel-note">This stores a notification record but does not send through Firebase, SMS, or email yet.</div>
        <div className="toolbar-grid">
          <div className="field">
            <label className="field-label" htmlFor="notification-title">Title</label>
            <input id="notification-title" className="field-input" placeholder="Summer savings update" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="notification-message">Message</label>
            <input id="notification-message" className="field-input" placeholder="Offer reminder shown in admin records" value={message} onChange={(event) => setMessage(event.target.value)} />
          </div>
        </div>
        <div className="panel-note">Current demo flow records notifications for the Customers segment only.</div>
        {error ? <div className="field-error">{error}</div> : null}
        <div className="page-actions">
          <button className="button button-primary" onClick={() => void submitNotification()} disabled={sending}>
            {sending ? "Saving demo record" : "Save demo notification"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Notification History</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Message</th>
                <th>Segment</th>
                <th>Status</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}><div className="empty-state">Loading notification history</div></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5}><div className="empty-state">No demo notifications recorded yet</div></td>
                </tr>
              ) : rows.map((notice) => (
                <tr key={notice.notificationId}>
                  <td>{notice.title}</td>
                  <td>{notice.message}</td>
                  <td>{notice.targetSegment}</td>
                  <td><StatusBadge tone={tone(notice.status)}>{notice.status}</StatusBadge></td>
                  <td>{notice.sentAt ? new Date(notice.sentAt).toLocaleString("en-IN") : "Recorded timestamp unavailable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
