import { apiClient, clearAuthSession, persistAuthSession } from '../api/axiosClient';
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
  token?: string;
  accessToken?: string;
  refreshToken?: string;
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

interface BackendAuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

function authTokens(response: BackendAuthResponse): { token: string; refreshToken: string } {
  const token = response.accessToken || response.token;
  const refreshToken = response.refreshToken;
  if (!token || !refreshToken) {
    throw new Error('Registration/login did not return a complete authenticated session.');
  }
  return { token, refreshToken };
}

export const authService = {
  register: async (request: PlumberRegistrationRequest): Promise<CredentialLoginResponse> => {
    const response = await apiClient.post<BackendAuthResponse>(
      ENDPOINTS.AUTH.REGISTER,
      request
    );
    const { token, refreshToken } = authTokens(response.data);
    await persistAuthSession(token, refreshToken);
    const plumber = await profileService.fetchProfile();
    return { plumber, token, refreshToken };
  },

  loginWithCredentials: async (
    email: string,
    password: string
  ): Promise<CredentialLoginResponse> => {
    try {
      const response = await apiClient.post<BackendAuthResponse>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      const { token, refreshToken } = authTokens(response.data);
      await persistAuthSession(token, refreshToken);

      const plumber = await profileService.fetchProfile();
      return { plumber, token, refreshToken };
    } catch (error) {
      throw createBackendUnavailableError('Plumber credential login', error);
    }
  },

  login: async (phone: string, code: string): Promise<{ plumber: PlumberProfile; token: string; refreshToken: string }> => {
    try {
      const response = await apiClient.post<LoginResponse>(ENDPOINTS.AUTH.VERIFY_OTP, { phone, code });
      const { token, refreshToken } = authTokens(response.data);
      const { email, userId } = response.data;

      await persistAuthSession(token, refreshToken);

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
        await persistAuthSession(token, refreshToken);
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
      await clearAuthSession();
    } catch (error) {
      console.error('Logout error:', error);
      // The session must be invalidated in memory even if durable storage is
      // unavailable during logout.
      try {
        await clearAuthSession();
      } catch {
        // Nothing else can safely be done here; callers still leave the
        // authenticated route.
      }
    }
  },
};
