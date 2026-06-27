"use client";

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accentColor?: string;
  delay?: number;
}

export default function KpiCard({
  icon, label, value, trend, trendUp, accentColor = "#14b8a6", delay = 0
}: KpiCardProps) {
  return (
    <div
      className="glass-card kpi-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient glow accent */}
      <div
        style={{
          position: "absolute", top: 0, right: 0,
          width: "120px", height: "120px",
          background: `radial-gradient(circle at top right, ${accentColor}18, transparent 70%)`,
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />
      <div className="kpi-icon" style={{ background: `${accentColor}18`, color: accentColor }}>
        {icon}
      </div>
      <div className="kpi-value" style={{ color: accentColor }}>{value}</div>
      <div className="kpi-label">{label}</div>
      {trend && (
        <div className="kpi-trend" style={{ color: trendUp ? "#34d399" : "#fb7185" }}>
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
