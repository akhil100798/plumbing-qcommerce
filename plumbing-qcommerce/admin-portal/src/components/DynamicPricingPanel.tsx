"use client";

interface SurgePricing {
  surgeLevel: string;
  deliverySurgeMultiplier: number;
  platformFeeMultiplier: number;
  activeOrders: number;
  isPeakHour: boolean;
  surgeDescription: string;
}

interface DynamicPricingPanelProps {
  data: SurgePricing | null;
  loading: boolean;
}

export default function DynamicPricingPanel({ data, loading }: DynamicPricingPanelProps) {
  if (loading || !data) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: "1.5rem" }}>📡</span>
        <span>Fetching demand signals…</span>
      </div>
    );
  }

  const surgeClass =
    data.surgeLevel === "HIGH"     ? "surge-high"     :
    data.surgeLevel === "MODERATE" ? "surge-moderate"  : "surge-normal";

  const surgeEmoji =
    data.surgeLevel === "HIGH"     ? "🔴" :
    data.surgeLevel === "MODERATE" ? "🟡" : "🟢";

  return (
    <div style={{ textAlign: "center" }}>
      <div className={`surge-ring ${surgeClass}`}>
        <span style={{ fontSize: "1.8rem", marginBottom: 4 }}>{surgeEmoji}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>
          {data.surgeLevel}
        </span>
      </div>

      <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: 16 }}>
        {data.surgeDescription}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)", borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>🚚 Delivery Fee</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9" }}>
            {data.deliverySurgeMultiplier}×
          </span>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)", borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>🔧 Platform Fee</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f1f5f9" }}>
            {data.platformFeeMultiplier}×
          </span>
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.03)", borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.07)"
        }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>📋 Active Orders</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#14b8a6" }}>
            {data.activeOrders}
          </span>
        </div>
        {data.isPeakHour && (
          <div className="badge badge-amber" style={{ justifyContent: "center", padding: "6px" }}>
            ⚡ Peak Hour Active
          </div>
        )}
      </div>
    </div>
  );
}
