import axios from 'axios';
import { apiClient } from '../apiClient';
import {
  createUnavailableFeatureError,
  getConfiguredEdgeUrl,
} from '../mockPolicy';
import { CreateOrderRequest, PlumberServiceOrderDTO } from './plumberTypes';

const EDGE_UNAVAILABLE_MESSAGE = 'Nearby plumber live tracking is not configured in staging.';

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
    const edgeServerUrl = getConfiguredEdgeUrl();
    if (!edgeServerUrl) {
      throw createUnavailableFeatureError(EDGE_UNAVAILABLE_MESSAGE);
    }

    const response = await axios.post(`${edgeServerUrl}/api/v1/edge/requests/nearby`, data);
    return response.data;
  },
};
