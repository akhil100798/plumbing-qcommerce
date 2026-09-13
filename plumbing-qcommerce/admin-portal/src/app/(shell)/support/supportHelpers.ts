export { formatDate, currency, supportTone } from "@/lib/helpers";
export const statuses = ["", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"] as const;
export const priorities = ["", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const categories = ["", "PRODUCT_ORDER", "SERVICE_JOB", "PAYMENT", "REFUND", "DELIVERY", "PLUMBER_SERVICE", "STORE_ISSUE", "ACCOUNT", "OTHER"] as const;
export const requesterRoles = ["", "CUSTOMER", "PLUMBER", "STORE_MANAGER", "DELIVERY_PARTNER"] as const;
