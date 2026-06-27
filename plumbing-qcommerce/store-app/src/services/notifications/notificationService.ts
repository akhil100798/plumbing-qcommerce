import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { AppNotification } from '../../types';
import { mockNotifications } from '../../mocks';

let localNotifications = [...mockNotifications];

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.notifications.list);
      return response.data || [];
    } catch (e) {
      console.warn('API getNotifications failed, fallback to mock:', e);
      return localNotifications;
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    try {
      await apiClient.patch(ENDPOINTS.notifications.markRead(id));
    } catch (e) {
      console.warn(`API markAsRead ${id} failed, fallback to mock:`, e);
      const notif = localNotifications.find(n => n.id === id);
      if (notif) notif.read = true;
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.patch(ENDPOINTS.notifications.markAllRead);
    } catch (e) {
      console.warn('API markAllRead failed, fallback to mock:', e);
      localNotifications.forEach(n => {
        n.read = true;
      });
    }
  }
};
