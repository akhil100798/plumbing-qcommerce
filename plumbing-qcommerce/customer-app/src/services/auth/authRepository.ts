import { apiClient, setAuthToken, setRefreshToken } from '../apiClient';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './authTypes';

export const AuthRepository = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    const result = response.data;
    if (result.token) {
      setAuthToken(result.token);
      setRefreshToken(result.refreshToken);
    }
    return result;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    setAuthToken(null);
    setRefreshToken(null);
  },

  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const response = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    });
    const result = response.data;
    if (result.token) {
      setAuthToken(result.token);
      setRefreshToken(result.refreshToken);
    }
    return result;
  },

  sendOtp: async (phone: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/send-otp', { phone });
    return response.data;
  },

  verifyOtp: async (phone: string, code: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/verify-otp', { phone, code });
    const result = response.data;
    if (result.token) {
      setAuthToken(result.token);
      setRefreshToken(result.refreshToken);
    }
    return result;
  },
};
