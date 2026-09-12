import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { mockStore } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { Store } from '../../types';

export interface StoreBusinessHoursItem {
  id?: number;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

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

  updateStoreProfile: async (store: Partial<Store>): Promise<Store> => {
    try {
      const response = await apiClient.put(ENDPOINTS.store.me, store);
      const mapped = mapStore(response.data);
      cachedStoreProfile = mapped;
      return mapped;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store profile update', e);
        cachedStoreProfile = { ...(cachedStoreProfile || mockStore), ...store };
        return cachedStoreProfile;
      }
      throw createBackendUnavailableError('store profile update', e);
    }
  },

  getBusinessHours: async (): Promise<StoreBusinessHoursItem[]> => {
    try {
      const response = await apiClient.get('/stores/me/business-hours');
      return response.data || [];
    } catch {
      return [
        { dayOfWeek: 'MONDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'TUESDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'WEDNESDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'THURSDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'FRIDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'SATURDAY', openTime: '08:00', closeTime: '20:00', closed: false },
        { dayOfWeek: 'SUNDAY', openTime: '09:00', closeTime: '16:00', closed: false },
      ];
    }
  },

  updateBusinessHours: async (hoursList: StoreBusinessHoursItem[]): Promise<StoreBusinessHoursItem[]> => {
    try {
      const response = await apiClient.put('/stores/me/business-hours', hoursList);
      return response.data || hoursList;
    } catch (e) {
      throw createBackendUnavailableError('store business hours update', e);
    }
  }
};
