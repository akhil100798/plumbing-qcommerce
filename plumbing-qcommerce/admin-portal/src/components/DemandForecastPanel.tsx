"use client";

interface ForecastEntry {
  productId: number;
  productName: string;
  sku: string;
  availableStock: number;
  demandScore: number;
  trend: string;
  lowStockAlert: boolean;
  category: string;
}

interface DemandForecastPanelProps {
  data: ForecastEntry[];
  loading: boolean;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "UP")   return <span style={{ color: "#34d399" }}>↑ Rising</span>;
  if (trend === "DOWN") return <span style={{ color: "#fb7185" }}>↓ Falling</span>;
  return <span style={{ color: "#94a3b8" }}>→ Stable</span>;
};

export default function DemandForecastPanel({ data, loading }: DemandForecastPanelProps) {
  if (loading) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: "1.5rem" }}>⚙️</span>
        <span>Analysing audit logs…</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: "1.5rem" }}>📦</span>
        <span>No inventory data available</span>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "320px", overflowY: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Score</th>
            <th>Stock</th>
            <th>Trend</th>
            <th>Alert</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.productId}>
              <td>
                <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{item.productName}</div>
                <div style={{ fontSize: "0.7rem", color: "#475569" }}>{item.sku}</div>
              </td>
              <td>
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  background: "rgba(20,184,166,0.12)",
                  color: "#14b8a6", padding: "2px 8px",
                  borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700
                }}>
                  {item.demandScore}
                </div>
              </td>
              <td style={{ color: item.availableStock < 10 ? "#fb7185" : "#94a3b8" }}>
                {item.availableStock}
              </td>
              <td style={{ fontSize: "0.75rem" }}>
                <TrendIcon trend={item.trend} />
              </td>
              <td>
                {item.lowStockAlert
                  ? <span className="badge badge-rose">Low</span>
                  : <span className="badge badge-green">OK</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
