import { apiClient } from '../api/axiosClient';

export interface SupportContactConfig {
  email: string | null;
  phone: string | null;
  appName: string;
  helpline: string | null;
}

export const configService = {
  getSupportContact: async (): Promise<SupportContactConfig> => {
    try {
      const response = await apiClient.get('/support/contact');
      return response.data;
    } catch {
      return {
        email: null,
        phone: null,
        appName: 'FixKart Store Partner',
        helpline: null,
      };
    }
  },
};
