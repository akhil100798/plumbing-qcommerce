import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_PLUMBER } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { PlumberProfile } from '../../types';

export const profileService = {
  fetchProfile: async (): Promise<PlumberProfile> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.USER.ME);
      const user = response.data;
      return {
        id: String(user.id),
        fullName: user.fullName || 'Plumber Partner',
        phone: user.phone || '',
        email: user.email || '',
        rating: Number(user.rating ?? 0),
        ratingsCount: Number(user.ratingsCount ?? 0),
        plumberId: user.plumberId || `PLB${user.id}`,
        availability: Boolean(user.availability),
      };
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Fetch plumber profile', error);
        return MOCK_PLUMBER;
      }
      throw createBackendUnavailableError('Plumber profile', error);
    }
  },

  updateAvailability: async (status: boolean): Promise<boolean> => {
    try {
      await apiClient.post(ENDPOINTS.USER.UPDATE_AVAILABILITY, { availability: status });
      return status;
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Update availability', error);
        return status;
      }
      throw createBackendUnavailableError('Availability updates', error);
    }
  },
};
