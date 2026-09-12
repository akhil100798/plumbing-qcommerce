export { formatDate, currency, supportTone } from "@/lib/helpers";
export const statuses = ["", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"] as const;
export const priorities = ["", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;