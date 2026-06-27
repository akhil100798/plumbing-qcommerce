import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Store } from '../../types';
import { mockStore } from '../../mocks';

export const storeService = {
  getStoreProfile: async (id: number): Promise<Store> => {
    try {
      const response = await apiClient.get(ENDPOINTS.store.details(id));
      return response.data;
    } catch (e) {
      console.warn('API getStoreProfile failed, using mock data:', e);
      return mockStore;
    }
  },

  // TODO: Implement backend endpoint PUT /api/v1/stores/{id}
  updateStoreProfile: async (store: Store): Promise<Store> => {
    console.warn('updateStoreProfile API missing. Fallback to mock.');
    return { ...mockStore, ...store };
  }
};
