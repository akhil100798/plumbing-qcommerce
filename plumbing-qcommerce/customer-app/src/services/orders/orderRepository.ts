import { apiClient } from '../apiClient';
import {
  OrderStatusDTO,
  PaymentRequestDTO,
  PaymentResponseDTO,
  ServiceOrderDTO,
} from './orderTypes';

export const OrderRepository = {
  getProductOrderDetails: async (id: number): Promise<any> => {
    const response = await apiClient.get<any>(`/checkout/orders/${id}`);
    return response.data;
  },

  getServiceOrderById: async (id: number): Promise<ServiceOrderDTO> => {
    const response = await apiClient.get<ServiceOrderDTO>(`/orders/${id}`);
    return response.data;
  },

  getCustomerServiceOrders: async (customerId: number): Promise<ServiceOrderDTO[]> => {
    const response = await apiClient.get<ServiceOrderDTO[]>(`/orders/customer/${customerId}`);
    return response.data;
  },

  getCustomerProductOrders: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/checkout/orders');
    return response.data;
  },

  getCustomerMaterialRequests: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/checkout/material-requests/customer');
    return response.data;
  },

  cancelServiceOrder: async (id: number): Promise<ServiceOrderDTO> => {
    const response = await apiClient.patch<ServiceOrderDTO>(`/orders/${id}/cancel`);
    return response.data;
  },

  getProductOrderStatus: async (orderId: number): Promise<OrderStatusDTO> => {
    const response = await apiClient.get<OrderStatusDTO>(`/delivery/${orderId}/status`);
    return response.data;
  },

  confirmProductDelivery: async (orderId: number, otp: string): Promise<OrderStatusDTO> => {
    const response = await apiClient.post<OrderStatusDTO>(`/delivery/${orderId}/confirm-otp`, { otp });
    return response.data;
  },

  processPayment: async (data: PaymentRequestDTO): Promise<PaymentResponseDTO> => {
    const payload = {
      orderId: data.orderId,
      amount: data.amount,
      paymentMethodId: data.paymentMethodId || data.paymentMethod || 'pm_mock_upi',
      currency: data.currency || 'INR',
    };
    const response = await apiClient.post<PaymentResponseDTO>('/payments/process', payload);
    return response.data;
  },

  confirmServiceOrder: async (orderId: number): Promise<import('./orderTypes').CustomerConfirmationResponse> => {
    const response = await apiClient.post<import('./orderTypes').CustomerConfirmationResponse>(`/orders/${orderId}/confirm`);
    return response.data;
  },

  submitServiceRating: async (
    orderId: number,
    rating: number,
    comment?: string
  ): Promise<import('./orderTypes').RatingResponse> => {
    const response = await apiClient.post<import('./orderTypes').RatingResponse>(`/orders/${orderId}/rating`, {
      rating,
      comment: comment?.trim() ? comment.trim() : undefined,
    });
    return response.data;
  },

  getServiceRating: async (orderId: number): Promise<import('./orderTypes').RatingResponse> => {
    const response = await apiClient.get<import('./orderTypes').RatingResponse>(`/orders/${orderId}/rating`);
    return response.data;
  },
};
