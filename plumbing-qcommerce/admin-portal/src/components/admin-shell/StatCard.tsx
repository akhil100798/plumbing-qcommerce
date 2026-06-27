interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}

export default function StatCard({ label, value, hint, accent = "#2563eb" }: StatCardProps) {
  return (
    <article className="stat-card" style={{ borderTopColor: accent }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-foot">{hint}</div> : null}
    </article>
  );
}
