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
    // Return mock stats as stats aren't directly calculated on the backend
    return Promise.resolve({
      walletBalance: 500,
      totalOrders: 12,
      rating: 4.9,
    });
  },

  getSavedCards: async (): Promise<SavedCard[]> => {
    return Promise.resolve([
      { id: 'c1', type: 'Visa', number: '•••• •••• •••• 4242', expiry: '12/28' },
      { id: 'c2', type: 'Mastercard', number: '•••• •••• •••• 5555', expiry: '08/29' },
    ]);
  },
};
