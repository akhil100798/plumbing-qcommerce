import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Store } from '../../types';
import { mockStore } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  createUnsupportedBackendError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

export const storeService = {
  getStoreProfile: async (id: number): Promise<Store> => {
    try {
      const response = await apiClient.get(ENDPOINTS.store.details(id));
      return response.data;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store profile', e);
        return mockStore;
      }
      throw createBackendUnavailableError('store profile', e);
    }
  },

  updateStoreProfile: async (store: Store): Promise<Store> => {
    if (!canUseDevMockFallbacks()) {
      throw createUnsupportedBackendError('Store profile updates');
    }

    warnUsingDevMockFallback('Store profile update', new Error('Store profile updates'));
    return { ...mockStore, ...store };
  }
};
