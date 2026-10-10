"use client";

import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import {
  activateLaunchRosterMember,
  deactivateLaunchRosterMember,
  listLaunchRosterMembers,
  listServiceLaunchPolicies,
  type LaunchRosterPlumber,
  type LaunchRosterPolicy,
} from "@/services/launchRosterService";

export default function LaunchRosterPage() {
  const [policies, setPolicies] = useState<LaunchRosterPolicy[]>([]);
  const [policyId, setPolicyId] = useState<number | null>(null);
  const [members, setMembers] = useState<LaunchRosterPlumber[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadMembers = useCallback(async (selectedPolicyId: number) => {
    setLoading(true);
    try {
      setMembers(await listLaunchRosterMembers(selectedPolicyId));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load roster members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listServiceLaunchPolicies().then((result) => {
      if (!active) return;
      setPolicies(result);
      if (result[0]) setPolicyId(result[0].policyId);
      else setLoading(false);
    }).catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : "Unable to load service launch policy");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (policyId !== null) void loadMembers(policyId);
  }, [policyId, loadMembers]);

  async function changeMembership(plumber: LaunchRosterPlumber) {
    if (policyId === null || !reason.trim()) {
      setError("Enter a reason before changing roster membership.");
      return;
    }
    const action = plumber.rosterApproved ? "deactivate" : "activate";
    const confirmed = window.confirm(`${action === "activate" ? "Activate" : "Deactivate"} ${plumber.fullName} for the service launch roster?`);
    if (!confirmed) return;
    setSavingId(plumber.plumberId);
    setError("");
    setSuccess("");
    try {
      const updated = action === "activate"
        ? await activateLaunchRosterMember(policyId, plumber.plumberId, reason)
        : await deactivateLaunchRosterMember(policyId, plumber.plumberId, reason);
      setMembers((current) => current.map((member) => member.plumberId === updated.plumberId ? updated : member));
      setSuccess(`${updated.fullName} roster membership ${updated.rosterApproved ? "activated" : "deactivated"}.`);
      setReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Roster update failed");
    } finally {
      setSavingId(null);
    }
  }

  const selectedPolicy = policies.find((policy) => policy.policyId === policyId);

  return <div className="stack">
    <section className="panel">
      <div className="page-header"><div>
        <h1 className="page-title">Service Launch Roster</h1>
        <p className="page-subtitle">Manage membership only. KYC approval and availability remain separate eligibility requirements.</p>
      </div></div>
      {error ? <div className="field-error" role="alert">{error}</div> : null}
      {success ? <div role="status">{success}</div> : null}
      {policies.length === 0 && !loading ? <div className="empty-state">No service launch policy exists. Roster management does not create or enable policies.</div> : null}
      {policies.length > 0 ? <div className="filter-grid">
        <label className="field-label" htmlFor="launch-policy">Service launch policy</label>
        <select id="launch-policy" className="field-input" value={policyId ?? ""} onChange={(event) => setPolicyId(Number(event.target.value))}>
          {policies.map((policy) => <option key={policy.policyId} value={policy.policyId}>#{policy.policyId} · {policy.policyKey}{policy.active ? " · active" : " · inactive"}</option>)}
        </select>
        {selectedPolicy ? <p className="page-subtitle">Roster enforcement: {selectedPolicy.rosterEnforcementEnabled ? "ON" : "OFF"}. This screen does not change policy settings.</p> : null}
      </div> : null}
    </section>
    {selectedPolicy ? <section className="panel">
      <label className="field-label" htmlFor="roster-reason">Reason for membership change</label>
      <input id="roster-reason" className="field-input" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required and recorded in audit history" />
      {loading ? <div className="loading-state">Loading roster…</div> : <div className="table-wrap">
        <table className="data-table"><thead><tr><th>Plumber</th><th>Account</th><th>KYC</th><th>Availability</th><th>Roster</th><th>Action</th></tr></thead>
          <tbody>{members.map((member) => <tr key={member.plumberId}>
            <td><div className="row-title">{member.fullName}</div><div className="row-subtitle">{member.email} · {member.phone}</div></td>
            <td>{member.role} · {member.userStatus}</td><td><StatusBadge tone={member.kycStatus === "APPROVED" ? "success" : "warning"}>{member.kycStatus}</StatusBadge></td>
            <td>{member.availabilityStatus}</td><td><StatusBadge tone={member.rosterApproved ? "success" : "neutral"}>{member.rosterApproved ? "ACTIVE" : "NOT ACTIVE"}</StatusBadge></td>
            <td><button className={member.rosterApproved ? "button button-secondary" : "button button-primary"} disabled={savingId !== null || (member.role !== "PLUMBER" && !member.rosterApproved) || (member.userStatus !== "ACTIVE" && !member.rosterApproved) || (member.kycStatus !== "APPROVED" && !member.rosterApproved) || !reason.trim()} onClick={() => void changeMembership(member)}>
              {savingId === member.plumberId ? "Saving…" : member.rosterApproved ? "Deactivate" : "Activate"}
            </button></td>
          </tr>)}
          {members.length === 0 ? <tr><td colSpan={6}>No plumber accounts found.</td></tr> : null}</tbody>
        </table>
      </div>}
    </section> : null}
  </div>;
}
