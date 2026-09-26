import type { ProductOrderStatus, ServiceJobStatus } from "@/services/operationsService";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-IN");
}

export function currency(value?: number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);
}

export function statusTone(status?: ProductOrderStatus | ServiceJobStatus | string | null): "success" | "warning" | "danger" | "neutral" | "info" {
  if (!status) return "neutral";
  if (["DELIVERED", "COMPLETED", "PAID", "AVAILABLE"].includes(status)) return "success";
  if (["CANCELLED", "FAILED"].includes(status)) return "danger";
  if (["OUT_FOR_DELIVERY", "COMBINED_ORDER"].includes(status)) return "info";
  if (["PACKING", "READY_FOR_PICKUP", "IN_PROGRESS", "ACCEPTED", "BUSY"].includes(status)) return "info";
  if (["PENDING", "CONFIRMED", "PENDING_PAYMENT"].includes(status)) return "warning";
  return "neutral";
}

export const productStatuses: Array<ProductOrderStatus | ""> = ["", "PENDING", "CONFIRMED", "PACKING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"];
export const serviceStatuses: Array<ServiceJobStatus | ""> = ["", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMBINED_ORDER", "COMPLETED", "PAID", "CANCELLED"];
