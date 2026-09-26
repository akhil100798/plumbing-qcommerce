export function currency(value?: number | null) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0); }
export function formatDate(value?: string | null) { if (!value) return "-"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("en-IN"); }
export function supportTone(status?: string | null): "success" | "warning" | "danger" | "neutral" | "info" { if (!status) return "neutral"; if (["RESOLVED"].includes(status)) return "success"; if (["OPEN"].includes(status)) return "warning"; if (["ESCALATED", "URGENT", "HIGH"].includes(status)) return "danger"; if (["IN_PROGRESS", "MEDIUM"].includes(status)) return "info"; return "neutral"; }
export const statuses = ["", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"] as const;
export const priorities = ["", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const categories = ["", "PRODUCT_ORDER", "SERVICE_JOB", "PAYMENT", "REFUND", "DELIVERY", "PLUMBER_SERVICE", "STORE_ISSUE", "ACCOUNT", "OTHER"] as const;
export const requesterRoles = ["", "CUSTOMER", "PLUMBER", "STORE_MANAGER", "DELIVERY_PARTNER"] as const;