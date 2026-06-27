import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

interface StatusBadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const toneClassMap: Record<BadgeTone, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  neutral: "badge-neutral",
  info: "badge-info",
};

export default function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`badge ${toneClassMap[tone]}`}>{children}</span>;
}
