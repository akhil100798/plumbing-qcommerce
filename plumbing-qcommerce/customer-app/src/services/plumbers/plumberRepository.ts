import axios from 'axios';
import { apiClient } from '../apiClient';
import { CreateOrderRequest, PlumberServiceOrderDTO } from './plumberTypes';

const EDGE_SERVER_URL = process.env.EXPO_PUBLIC_EDGE_SERVER_URL || 'http://localhost:3000';

export const PlumberRepository = {
  createServiceOrder: async (data: CreateOrderRequest): Promise<PlumberServiceOrderDTO> => {
    const response = await apiClient.post<PlumberServiceOrderDTO>('/orders', data);
    return response.data;
  },

  requestNearbyPlumber: async (data: {
    customerId: number;
    longitude: number;
    latitude: number;
    requestType: string;
    category: string;
  }): Promise<{ message: string; notified: any[] }> => {
    const response = await axios.post(`${EDGE_SERVER_URL}/api/v1/edge/requests/nearby`, data);
    return response.data;
  },
};
