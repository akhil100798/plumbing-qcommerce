import { apiClient } from '../apiClient';
import { CheckoutRequest, ProductOrderDTO } from './cartTypes';

export const CartRepository = {
  reserveStock: async (data: CheckoutRequest): Promise<ProductOrderDTO> => {
    const response = await apiClient.post<ProductOrderDTO>('/checkout/reserve', data);
    return response.data;
  },

  confirmPayment: async (orderId: number): Promise<void> => {
    await apiClient.post(`/checkout/confirm/${orderId}`);
  },

  releaseReservation: async (orderId: number): Promise<void> => {
    await apiClient.post(`/checkout/release/${orderId}`);
  },
};
