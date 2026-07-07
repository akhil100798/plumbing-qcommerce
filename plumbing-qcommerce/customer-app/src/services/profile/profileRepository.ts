import { apiClient } from '../apiClient';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
}

export interface ProfileStats {
  walletBalance: number;
  totalOrders: number;
  rating: number;
}

export interface SavedCard {
  id: string;
  type: string;
  number: string;
  expiry: string;
}

export const ProfileRepository = {
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me');
    return response.data;
  },

  getStats: async (): Promise<ProfileStats> => {
    return {
      walletBalance: 0,
      totalOrders: 0,
      rating: 0,
    };
  },

  getSavedCards: async (): Promise<SavedCard[]> => {
    return [];
  },
};
