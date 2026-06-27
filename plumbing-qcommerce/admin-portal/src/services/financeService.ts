import { apiRequest } from "./apiClient";

export type FinanceStatus = "SUCCESS" | "PENDING" | "FAILED" | "PAID" | "APPROVED" | "REJECTED" | "PROCESSED";
export type SettlementStatus = "PENDING" | "PAID" | "FAILED";
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

export interface PageResponse<T> { content: T[]; number: number; size: number; totalElements: number; totalPages: number; }
export interface FinanceDashboardResponse { totalRevenue: number; todayRevenue: number; totalPayments: number; successfulPayments: number; failedPayments: number; pendingPayments: number; totalRefunds: number; pendingRefunds: number; totalStoreSettlements: number; pendingStoreSettlements: number; totalPlumberPayouts: number; pendingPlumberPayouts: number; totalDeliveryPayouts: number; pendingDeliveryPayouts: number; platformCommission: number; walletBalanceTotal: number; }
export interface FinancePaymentSummary { paymentId: string; orderId: number; customerName: string; amount: number; status: string; paymentMethod: string; transactionReference: string; createdAt?: string | null; updatedAt?: string | null; }
export interface FinancePaymentDetail extends FinancePaymentSummary { orderType: string; customerPhone?: string | null; customerEmail?: string | null; gatewayReference: string; transactionStatus: string; failureReason?: string | null; }
export interface StoreSettlementSummary { settlementId: number; storeId: number; storeName: string; grossAmount: number; commissionAmount: number; netAmount: number; status: SettlementStatus; createdAt?: string | null; paidAt?: string | null; }
export interface PlumberPayoutSummary { payoutId: number; plumberId: number; plumberName: string; completedJobs: number; grossAmount: number; commissionAmount: number; netAmount: number; status: SettlementStatus; createdAt?: string | null; paidAt?: string | null; }
export interface DeliveryPayoutSummary { payoutId: number; deliveryPartnerId: number; deliveryPartnerName: string; completedDeliveries: number; grossAmount: number; commissionAmount: number; netAmount: number; status: SettlementStatus; createdAt?: string | null; paidAt?: string | null; }
export interface RefundSummary { refundId: number; orderId: number; customerName: string; amount: number; reason: string; status: RefundStatus; requestedAt?: string | null; processedAt?: string | null; }
export interface CommissionReportResponse { totalGrossRevenue: number; totalCommission: number; storeCommission: number; plumberCommission: number; deliveryCommission: number; netPayable: number; reportGeneratedAt: string; }

function qs(params: Record<string, string | number | undefined>) { const q = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); }); const s = q.toString(); return s ? `?${s}` : ""; }
export const getFinanceDashboard = () => apiRequest<FinanceDashboardResponse>("/api/v1/admin/finance/dashboard");
export const listFinancePayments = (query: {status?: string; paymentMethod?: string; search?: string; fromDate?: string; toDate?: string; page?: number; size?: number} = {}) => apiRequest<PageResponse<FinancePaymentSummary>>(`/api/v1/admin/finance/payments${qs({...query, page: query.page ?? 0, size: query.size ?? 10})}`);
export const getFinancePayment = (id: string) => apiRequest<FinancePaymentDetail>(`/api/v1/admin/finance/payments/${id}`);
export const listStoreSettlements = (query: {status?: string; storeId?: string; fromDate?: string; toDate?: string; page?: number; size?: number} = {}) => apiRequest<PageResponse<StoreSettlementSummary>>(`/api/v1/admin/finance/settlements/stores${qs({...query, page: query.page ?? 0, size: query.size ?? 10})}`);
export const listPlumberPayouts = (page = 0, size = 10) => apiRequest<PageResponse<PlumberPayoutSummary>>(`/api/v1/admin/finance/payouts/plumbers${qs({page, size})}`);
export const listDeliveryPayouts = (page = 0, size = 10) => apiRequest<PageResponse<DeliveryPayoutSummary>>(`/api/v1/admin/finance/payouts/delivery-partners${qs({page, size})}`);
export const listRefunds = (query: {status?: string; search?: string; fromDate?: string; toDate?: string; page?: number; size?: number} = {}) => apiRequest<PageResponse<RefundSummary>>(`/api/v1/admin/finance/refunds${qs({...query, page: query.page ?? 0, size: query.size ?? 10})}`);
export const approveRefund = (refundId: number, note: string) => apiRequest<RefundSummary>(`/api/v1/admin/finance/refunds/${refundId}/approve`, { method: "PATCH", body: { note } });
export const rejectRefund = (refundId: number, note: string) => apiRequest<RefundSummary>(`/api/v1/admin/finance/refunds/${refundId}/reject`, { method: "PATCH", body: { note } });
export const getCommissionReport = (fromDate?: string, toDate?: string) => apiRequest<CommissionReportResponse>(`/api/v1/admin/finance/commission-report${qs({fromDate, toDate})}`);