import { apiClient } from '../apiClient';
import { StoreDTO } from './storeTypes';

export const StoreRepository = {
  getAllStores: async (): Promise<StoreDTO[]> => {
    const response = await apiClient.get<StoreDTO[]>('/stores');
    return response.data;
  },

  getStoreById: async (id: number): Promise<StoreDTO> => {
    const response = await apiClient.get<StoreDTO>(`/stores/${id}`);
    return response.data;
  },
};
