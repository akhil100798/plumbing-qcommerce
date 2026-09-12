import type { ProductOrderStatus, ServiceJobStatus } from "@/services/operationsService";

export { formatDate, currency, statusTone } from "@/lib/helpers";

export const productStatuses: Array<ProductOrderStatus | ""> = ["", "PENDING", "CONFIRMED", "PACKING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"];
export const serviceStatuses: Array<ServiceJobStatus | ""> = ["", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMBINED_ORDER", "COMPLETED", "PAID", "CANCELLED"];