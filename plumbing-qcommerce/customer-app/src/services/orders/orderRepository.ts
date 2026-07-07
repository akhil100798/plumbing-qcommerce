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
    const response = await apiClient.post<PaymentResponseDTO>('/payments/process', data);
    return response.data;
  },
};
