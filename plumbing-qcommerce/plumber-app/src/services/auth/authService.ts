import { apiClient, setAuthToken, setRefreshToken } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_PLUMBER } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { PlumberProfile } from '../../types';
import { profileService } from '../profile/profileService';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  role: string;
  email: string;
}

export interface CredentialLoginResponse {
  plumber: PlumberProfile;
  token: string;
  refreshToken: string;
}

export interface PlumberRegistrationRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const authService = {
  register: async (request: PlumberRegistrationRequest): Promise<CredentialLoginResponse> => {
    const response = await apiClient.post<{ token: string; refreshToken: string }>(
      ENDPOINTS.AUTH.REGISTER,
      request
    );
    const { token, refreshToken } = response.data;
    setAuthToken(token);
    setRefreshToken(refreshToken);
    const plumber = await profileService.fetchProfile();
    return { plumber, token, refreshToken };
  },

  loginWithCredentials: async (
    email: string,
    password: string
  ): Promise<CredentialLoginResponse> => {
    try {
      const response = await apiClient.post<{ token: string; refreshToken: string }>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const { token, refreshToken } = response.data;

      setAuthToken(token);
      setRefreshToken(refreshToken);

      const plumber = await profileService.fetchProfile();
      return { plumber, token, refreshToken };
    } catch (error) {
      if (canUseDevMockFallbacks() && (email.toLowerCase().includes('plumber') || email.toLowerCase().includes('rajesh') || email.toLowerCase().includes('fixkart') || email.length > 0)) {
        warnUsingDevMockFallback('Plumber credential login', error);
        const token = 'mock_jwt_token';
        const refreshToken = 'mock_refresh_token';
        setAuthToken(token);
        setRefreshToken(refreshToken);
        return {
          plumber: { ...MOCK_PLUMBER, email, availability: true },
          token,
          refreshToken,
        };
      }
      throw createBackendUnavailableError('Plumber credential login', error);
    }
  },

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
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (canUseDevMockFallbacks() && (cleanPhone.endsWith('9876543210') || cleanPhone === '1234567890' || cleanPhone.length === 10) && code === '123456') {
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
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (canUseDevMockFallbacks() && (cleanPhone.endsWith('9876543210') || cleanPhone.length >= 10)) {
        warnUsingDevMockFallback('Plumber OTP send', error);
        return { message: 'OTP sent successfully (Mock)' };
      }
      throw createBackendUnavailableError('Plumber OTP send', error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.warn('Backend logout failed or was unreachable:', error);
    } finally {
      setAuthToken(null);
      setRefreshToken(null);
    }
  },
};
