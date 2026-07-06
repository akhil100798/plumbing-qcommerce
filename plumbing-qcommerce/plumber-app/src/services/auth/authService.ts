import { apiClient, setAuthToken, setRefreshToken } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_PLUMBER } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { PlumberProfile } from '../../types';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  role: string;
  email: string;
}

export const authService = {
  login: async (phone: string, code: string): Promise<{ plumber: PlumberProfile; token: string; refreshToken: string }> => {
    try {
      const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.VERIFY_OTP, { phone, code });
      const { token, refreshToken, email, userId } = response.data;
      
      setAuthToken(token);
      setRefreshToken(refreshToken);

      const plumberProfile: PlumberProfile = {
        id: userId,
        fullName: email.split('@')[0],
        phone: phone,
        email: email,
        rating: 4.9,
        ratingsCount: 324,
        plumberId: 'PLB' + userId,
        availability: true,
      };

      return { plumber: plumberProfile, token, refreshToken };
    } catch (error) {
      if (canUseDevMockFallbacks() && phone === '+91 98765 43210' && code === '123456') {
        warnUsingDevMockFallback('Plumber login', error);
        const token = 'mock_jwt_token';
        const refreshToken = 'mock_refresh_token';
        setAuthToken(token);
        setRefreshToken(refreshToken);
        return {
          plumber: { ...MOCK_PLUMBER, availability: true },
          token,
          refreshToken,
        };
      }
      throw createBackendUnavailableError('Plumber login', error);
    }
  },

  sendOtp: async (phone: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(ENDPOINTS.AUTH.SEND_OTP, { phone });
      return response.data;
    } catch (error) {
      if (canUseDevMockFallbacks() && phone === '+91 98765 43210') {
        warnUsingDevMockFallback('Plumber OTP send', error);
        return { message: 'OTP sent successfully (Mock)' };
      }
      throw createBackendUnavailableError('Plumber OTP send', error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      setAuthToken(null);
      setRefreshToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthToken(null);
      setRefreshToken(null);
    }
  },
};
