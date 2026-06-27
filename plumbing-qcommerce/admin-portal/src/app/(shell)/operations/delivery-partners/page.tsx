"use client";

import { useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { listAvailableDeliveryPartners, type AvailableDeliveryPartnerResponse } from "@/services/operationsService";
import { statusTone } from "../operationsHelpers";

export default function OperationsDeliveryPartnersPage() {
  const [partners, setPartners] = useState<AvailableDeliveryPartnerResponse[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listAvailableDeliveryPartners().then(setPartners).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load delivery partners"));
  }, []);

  return <div className="stack"><section className="panel"><div className="page-header"><div><h1 className="page-title">Delivery Partners</h1><p className="page-subtitle">Available delivery capacity and active load.</p></div><StatusBadge tone="info">{partners.length} active partners</StatusBadge></div>{error ? <div className="field-error">{error}</div> : null}</section><section className="panel"><div className="table-shell"><table className="table"><thead><tr><th>Partner</th><th>Phone</th><th>Status</th><th>Active Load</th><th>Last Location</th></tr></thead><tbody>{partners.map((partner) => <tr key={partner.id}><td><div className="row-title">{partner.name}</div><div className="row-subtitle">#{partner.id}</div></td><td>{partner.phone}</td><td><StatusBadge tone={statusTone(partner.currentStatus)}>{partner.currentStatus}</StatusBadge></td><td>{partner.activeDeliveryCount ?? 0}</td><td>{partner.lastKnownLocation ?? "UNKNOWN"}</td></tr>)}</tbody></table></div></section></div>;
}
