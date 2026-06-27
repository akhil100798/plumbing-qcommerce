"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  orders: number;
}

interface OrdersTrendChartProps {
  data: DataPoint[];
}

interface OrdersTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: OrdersTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1a2235", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "8px", padding: "10px 14px", fontSize: "0.8rem",
      }}>
        <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>
        <p style={{ color: "#14b8a6", fontWeight: 700 }}>{payload[0].value ?? 0} orders</p>
      </div>
    );
  }
  return null;
};

export default function OrdersTrendChart({ data }: OrdersTrendChartProps) {
  // Format date label to short form: "Jun 21"
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#14b8a6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#14b8a6", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#5eead4" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
