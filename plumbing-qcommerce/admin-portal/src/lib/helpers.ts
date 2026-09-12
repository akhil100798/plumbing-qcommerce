// Canonical FixKart portal helper functions.
// All section helpers re-export from here to avoid duplication.

export function currency(value?: number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-IN");
}

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

function baseTone(status?: string | null): Tone {
  if (!status) return "neutral";
  const s = status.toUpperCase();
  if (["DELIVERED", "COMPLETED", "PAID", "SUCCESS", "APPROVED", "PROCESSED", "RESOLVED", "AVAILABLE", "SENT", "ACTIVE", "ONLINE"].includes(s)) return "success";
  if (["CANCELLED", "FAILED", "REJECTED", "SUSPENDED", "ESCALATED", "URGENT", "HIGH", "LOW_STOCK"].includes(s)) return "danger";
  if (["OUT_FOR_DELIVERY", "IN_PROGRESS", "COMBINED_ORDER", "PROCESSING", "REFUNDED", "BUSY", "MEDIUM", "PACKING"].includes(s)) return "info";
  if (["PENDING", "CONFIRMED", "PENDING_PAYMENT", "SCHEDULED", "PAUSED", "OPEN", "REQUESTED"].includes(s)) return "warning";
  return "neutral";
}

export function statusTone(status?: string | null): Tone {
  return baseTone(status);
}

// Backward-compatible aliases used by section helper modules / pages.
export const financeTone = statusTone;
export const supportTone = statusTone;
export const tone = statusTone;
export const money = currency;
export const date = formatDate;
