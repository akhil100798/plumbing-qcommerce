"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/admin-shell/StatusBadge";
import { createOffer, offers, toggleOffer, type Offer } from "@/services/marketingService";
import { money, tone } from "../helpers";

const initialForm = {
  code: "",
  title: "",
  discountType: "PERCENTAGE",
  discountValue: 10,
  minOrderAmount: 0,
  startsAt: "",
  endsAt: "",
};

export default function OffersPage() {
  const [rows, setRows] = useState<Offer[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validationHint = useMemo(() => {
    if (!form.code.trim()) return "Offer code should be unique and not left blank.";
    if (form.discountValue <= 0) return "Discount value must be greater than zero.";
    if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) return "End date must be later than the start date.";
    return "Codes should stay unique, discounts must stay positive, and start/end dates should define a valid window.";
  }, [form]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const response = await offers({ search });
      setRows(response.content);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load offers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitOffer() {
    if (!form.code.trim() || !form.title.trim()) {
      setError("Code and title are required before creating an offer.");
      return;
    }
    if (form.discountValue <= 0) {
      setError("Discount value must be greater than zero.");
      return;
    }
    if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
      setError("Start date must be earlier than end date.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createOffer({
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
      });
      setForm(initialForm);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create offer");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(offerId: number, nextActive: boolean) {
    try {
      setError("");
      await toggleOffer(offerId, nextActive);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update offer status");
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="page-title">Offers &amp; Coupons</h1>
            <p className="page-subtitle">Manage offer records and activation windows without claiming checkout discount application from this page alone.</p>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="offer-search">Search offers</label>
          <input id="offer-search" className="field-input" placeholder="Search by code or title" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {error ? <div className="field-error">{error}</div> : null}
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Offer</th>
                <th>Discount</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">Loading offers</div></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}><div className="empty-state">No offers match the current search</div></td>
                </tr>
              ) : rows.map((offerRow) => (
                <tr key={offerRow.offerId}>
                  <td>{offerRow.code}</td>
                  <td>
                    <Link className="inline-link" href={`/marketing/offers/${offerRow.offerId}`}>{offerRow.title}</Link>
                  </td>
                  <td>{offerRow.discountType} {money(offerRow.discountValue)}</td>
                  <td>{offerRow.usedCount}/{offerRow.usageLimit ?? "unlimited"}</td>
                  <td><StatusBadge tone={tone(offerRow.active ? "ACTIVE" : "PAUSED")}>{offerRow.active ? "ACTIVE" : "INACTIVE"}</StatusBadge></td>
                  <td>
                    <button className="button button-secondary" onClick={() => void toggle(offerRow.offerId, !offerRow.active)}>
                      {offerRow.active ? "Deactivate" : "Activate"}
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
          <h2 className="panel-title">Create Offer</h2>
        </div>
        <div className="panel-note">Validation reminders: keep the code unique, keep discount values positive, and make sure the start and end dates form a valid time window.</div>
        <div className="toolbar-grid">
          <div className="field">
            <label className="field-label" htmlFor="offer-code">Offer code</label>
            <input id="offer-code" className="field-input" placeholder="PLUMB10" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-title">Title</label>
            <input id="offer-title" className="field-input" placeholder="Plumbing essentials discount" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-discount-type">Discount type</label>
            <select id="offer-discount-type" className="field-input" value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat amount</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-discount-value">Discount value</label>
            <input id="offer-discount-value" className="field-input" type="number" min="1" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: Number(event.target.value) }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-min-order">Minimum order amount</label>
            <input id="offer-min-order" className="field-input" type="number" min="0" value={form.minOrderAmount} onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: Number(event.target.value) }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-starts-at">Start date</label>
            <input id="offer-starts-at" className="field-input" type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="offer-ends-at">End date</label>
            <input id="offer-ends-at" className="field-input" type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
          </div>
        </div>
        <div className="panel-note">{validationHint}</div>
        <div className="page-actions">
          <button className="button button-primary" onClick={() => void submitOffer()} disabled={submitting}>
            {submitting ? "Creating offer" : "Create offer"}
          </button>
        </div>
      </section>
    </div>
  );
}
