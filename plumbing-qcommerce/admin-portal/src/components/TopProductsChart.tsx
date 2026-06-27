"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface ProductEntry {
  productName: string;
  demandScore: number;
  trend: string;
}

interface TopProductsChartProps {
  data: ProductEntry[];
}

const COLORS = ["#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#f43f5e"];

interface ProductTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload: {
      productName?: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: ProductTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1a2235", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "8px", padding: "10px 14px", fontSize: "0.8rem",
      }}>
        <p style={{ color: "#f1f5f9", fontWeight: 700, marginBottom: 4 }}>
          {payload[0].payload.productName}
        </p>
        <p style={{ color: "#14b8a6" }}>Score: {payload[0].value ?? 0}</p>
      </div>
    );
  }
  return null;
};

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const top5 = data.slice(0, 5);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={top5} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="productName"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
        />
        <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="demandScore" radius={[4, 4, 0, 0]}>
          {top5.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
