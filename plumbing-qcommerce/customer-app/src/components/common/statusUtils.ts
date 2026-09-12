import { OrderStatus } from "../../data/orders";
import { StatusType } from "./StatusChip";

export function mapOrderStatusToType(status: OrderStatus): StatusType {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    case "materials_pending":
      return "warning";
    case "in_progress":
      return "info";
    case "assigned":
    case "confirmed":
      return "primary";
    case "requested":
      return "warning";
    default:
      return "neutral";
  }
}