import { apiRequest } from "./apiClient";

export type ProductOrderStatus = "PENDING" | "CONFIRMED" | "PACKING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "CANCELLED";
export type MaterialRequestStatus = "REQUESTED" | "STORE_REVIEWING" | "APPROVED" | "PARTIALLY_AVAILABLE" | "REJECTED" | "RESERVED" | "PREPARING" | "READY_FOR_PICKUP" | "PLUMBER_AT_STORE" | "COLLECTED" | "CANCELLED";
export type ServiceJobStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMBINED_ORDER" | "COMPLETED" | "PAID" | "CANCELLED";

export interface OperationsDashboardResponse {
  activeProductOrders: number;
  pendingProductOrders: number;
  packedOrders: number;
  outForDeliveryOrders: number;
  delayedOrders: number;
  activeServiceJobs: number;
  pendingServiceJobs: number;
  plumbersOnJob: number;
  pendingMaterialRequests: number;
  activeDeliveries: number;
  availableDeliveryPartners: number;
  cancelledToday: number;
  completedToday: number;
}

export interface OperationsProductOrderSummary {
  orderId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  storeName?: string | null;
  totalAmount?: number | null;
  status: ProductOrderStatus;
  paymentStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  deliveryPartnerName?: string | null;
  delayFlag: boolean;
}

export interface OperationsProductOrderDetail extends OperationsProductOrderSummary {
  customer?: { id: number; name: string; phone: string; email: string } | null;
  store?: { id: number; name: string; address: string } | null;
  estimatedDeliveryAt?: string | null;
  deliveryPartner?: { id: number; name: string; phone: string } | null;
  linkedServiceOrderId?: number | null;
  items: Array<{ productId?: number | null; productName: string; quantity: number; price: number }>;
  statusHistory: string[];
}

export interface OperationsServiceJobSummary {
  jobId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  plumberName?: string | null;
  plumberPhone?: string | null;
  requestType?: string | null;
  status: ServiceJobStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  delayFlag: boolean;
}

export interface OperationsServiceJobDetail extends OperationsServiceJobSummary {
  customer?: { id: number; name: string; phone: string; email: string } | null;
  plumber?: { id: number; name: string; phone: string; email: string } | null;
  description?: string | null;
  address?: { latitude?: number | null; longitude?: number | null } | null;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  materialRequests: OperationsMaterialRequestSummary[];
  logs: string[];
}

export interface OperationsMaterialRequestSummary {
  requestId: number;
  serviceOrderId?: number | null;
  plumberName?: string | null;
  customerName?: string | null;
  storeName?: string | null;
  status: ProductOrderStatus;
  amount?: number | null;
  createdAt?: string | null;
}

export interface OperationsMaterialRequestDetail {
  requestId: number;
  serviceOrderId?: number | null;
  plumberName?: string | null;
  customerName?: string | null;
  storeName?: string | null;
  status: MaterialRequestStatus;
  amount?: number | null;
  createdAt?: string | null;
  storeConfirmedAt?: string | null;
  plumberArrivedAt?: string | null;
  collectionConfirmedAt?: string | null;
  notes?: string | null;
  items: Array<{ productName: string; requestedQuantity: number; reservedQuantity: number; unitPrice: number }>;
  statusHistory: Array<{ status: string; changedAt: string; notes?: string | null }>;
}

export interface AvailableDeliveryPartnerResponse {
  id: number;
  name: string;
  phone: string;
  currentStatus: string;
  lastKnownLocation?: string | null;
  activeDeliveryCount?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function toQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const output = query.toString();
  return output ? `?${output}` : "";
}

export function getOperationsDashboard() {
  return apiRequest<OperationsDashboardResponse>("/api/v1/admin/operations/dashboard");
}

export function listOperationsProductOrders(query: { status?: ProductOrderStatus | ""; search?: string; storeId?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<OperationsProductOrderSummary>>(`/api/v1/admin/operations/product-orders${toQueryString({ status: query.status || undefined, search: query.search, storeId: query.storeId, page: query.page ?? 0, size: query.size ?? 10 })}`);
}

export function getOperationsProductOrder(id: string | number) {
  return apiRequest<OperationsProductOrderDetail>(`/api/v1/admin/operations/product-orders/${id}`);
}

export function listOperationsServiceJobs(query: { status?: ServiceJobStatus | ""; search?: string; plumberId?: string; customerId?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<OperationsServiceJobSummary>>(`/api/v1/admin/operations/service-jobs${toQueryString({ status: query.status || undefined, search: query.search, plumberId: query.plumberId, customerId: query.customerId, page: query.page ?? 0, size: query.size ?? 10 })}`);
}

export function getOperationsServiceJob(id: string | number) {
  return apiRequest<OperationsServiceJobDetail>(`/api/v1/admin/operations/service-jobs/${id}`);
}

export function listOperationsMaterialRequests(query: { status?: ProductOrderStatus | ""; plumberId?: string; orderId?: string; page?: number; size?: number } = {}) {
  return apiRequest<PageResponse<OperationsMaterialRequestSummary>>(`/api/v1/admin/operations/material-requests${toQueryString({ status: query.status || undefined, plumberId: query.plumberId, orderId: query.orderId, page: query.page ?? 0, size: query.size ?? 10 })}`);
}

export function listAvailableDeliveryPartners() {
  return apiRequest<AvailableDeliveryPartnerResponse[]>("/api/v1/admin/operations/delivery-partners/available");
}

export function reassignPlumber(jobId: string | number, plumberId: number, reason: string) {
  return apiRequest<OperationsServiceJobSummary>(`/api/v1/admin/operations/service-jobs/${jobId}/reassign-plumber`, { method: "PATCH", body: { plumberId, reason } });
}

export function reassignDelivery(orderId: string | number, deliveryPartnerId: number, reason: string) {
  return apiRequest<OperationsProductOrderSummary>(`/api/v1/admin/operations/product-orders/${orderId}/reassign-delivery`, { method: "PATCH", body: { deliveryPartnerId, reason } });
}

export function cancelOperationsProductOrder(orderId: string | number, reason: string) {
  return apiRequest<OperationsProductOrderSummary>(`/api/v1/admin/operations/product-orders/${orderId}/cancel`, { method: "PATCH", body: { reason } });
}

// ── Admin Material Requests (AdminMaterialRequestController) ─────────────────

export function listAdminMaterialRequests(query: {
  status?: MaterialRequestStatus | "";
  storeId?: string;
  plumberId?: string;
  customerId?: string;
  serviceOrderId?: string;
  page?: number;
  size?: number;
} = {}) {
  return apiRequest<PageResponse<OperationsMaterialRequestSummary>>(
    `/api/v1/admin/material-requests${toQueryString({
      status: query.status || undefined,
      storeId: query.storeId,
      plumberId: query.plumberId,
      customerId: query.customerId,
      serviceOrderId: query.serviceOrderId,
      page: query.page ?? 0,
      size: query.size ?? 20,
    })}`
  );
}

export function getAdminMaterialRequest(id: string | number) {
  return apiRequest<OperationsMaterialRequestDetail>(`/api/v1/admin/material-requests/${id}`);
}

export function adminReassignMaterialRequestStore(id: string | number, storeId: number) {
  return apiRequest<OperationsMaterialRequestDetail>(`/api/v1/admin/material-requests/${id}/reassign-store`, {
    method: "POST",
    body: { storeId },
  });
}

export function adminCancelMaterialRequest(id: string | number, reason: string) {
  return apiRequest<OperationsMaterialRequestDetail>(`/api/v1/admin/material-requests/${id}/cancel`, {
    method: "POST",
    body: { reason },
  });
}

