import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { mockStore } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  createUnsupportedBackendError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { Store } from '../../types';

let cachedStoreProfile: Store | null = null;

const mapStore = (data: any): Store => ({
  id: Number(data.id),
  name: data.name,
  address: data.address,
  latitude: Number(data.latitude ?? 0),
  longitude: Number(data.longitude ?? 0),
  rating: data.rating != null ? Number(data.rating) : undefined,
  phone: data.phone,
  email: data.email,
  imageUrl: data.imageUrl,
});

export const storeService = {
  getStoreProfile: async (id?: number): Promise<Store> => {
    try {
      const response = await apiClient.get(id ? ENDPOINTS.store.details(id) : ENDPOINTS.store.me);
      const mapped = mapStore(response.data);
      cachedStoreProfile = mapped;
      return mapped;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store profile', e);
        return cachedStoreProfile || mockStore;
      }
      throw createBackendUnavailableError('store profile', e);
    }
  },

  getCurrentStoreProfile: async (): Promise<Store> => {
    if (cachedStoreProfile) {
      return cachedStoreProfile;
    }
    return storeService.getStoreProfile();
  },

  updateStoreProfile: async (store: Store): Promise<Store> => {
    if (!canUseDevMockFallbacks()) {
      throw createUnsupportedBackendError('Store profile updates');
    }

    warnUsingDevMockFallback('Store profile update', new Error('Store profile updates'));
    cachedStoreProfile = { ...(cachedStoreProfile || mockStore), ...store };
    return cachedStoreProfile;
  }
};
