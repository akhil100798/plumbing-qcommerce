import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_PLUMBER } from '../mocks/mockData';
import { PlumberProfile } from '../../types';

export const profileService = {
  fetchProfile: async (): Promise<PlumberProfile> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.USER.ME);
      const user = response.data;
      return {
        id: String(user.id),
        fullName: user.fullName || 'Ravi Kumar',
        phone: user.phone || '+91 98765 43210',
        email: user.email || 'ravi.kumar@plumbcommerce.com',
        rating: 4.9,
        ratingsCount: 324,
        plumberId: 'PLB' + user.id,
        availability: user.availability || false,
      };
    } catch (error) {
      console.warn('Failed to fetch user profile, using mock profile', error);
      return MOCK_PLUMBER;
    }
  },

  updateAvailability: async (status: boolean): Promise<boolean> => {
    try {
      // POST /users/me/availability
      await apiClient.post(ENDPOINTS.USER.UPDATE_AVAILABILITY, { availability: status });
      return status;
    } catch (error) {
      console.warn('Failed to update availability status, using local sync', error);
      return status;
    }
  },
};
