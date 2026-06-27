import { apiClient, setAuthToken, setRefreshToken } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { User } from '../../types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    const response = await apiClient.post(ENDPOINTS.auth.login, { email, password });
    const { token, refreshToken, userId, role, phone, fullName } = response.data;
    const user: User = { id: userId, email, fullName, role, phone };
    
    setAuthToken(token);
    setRefreshToken(refreshToken);
    return { user, token, refreshToken };
  },

  sendOtp: async (phone: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.auth.sendOtp, { phone });
  },

  verifyOtp: async (phone: string, code: string): Promise<{ user: User; token: string; refreshToken: string }> => {
    const response = await apiClient.post(ENDPOINTS.auth.verifyOtp, { phone, code });
    const { token, refreshToken, userId, role, email, fullName } = response.data;
    const user: User = { id: userId, email, fullName, role, phone };
    
    setAuthToken(token);
    setRefreshToken(refreshToken);
    return { user, token, refreshToken };
  },

  logout: async (): Promise<void> => {
    setAuthToken(null);
    setRefreshToken(null);
  }
};
