import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { AppNotification } from '../../types';
import { mockNotifications } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

let localNotifications = [...mockNotifications];

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.notifications.list);
      return response.data || [];
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store notifications list', e);
        return localNotifications;
      }
      throw createBackendUnavailableError('Notifications', e);
    }
  },

  markAsRead: async (id: number): Promise<void> => {
    try {
      await apiClient.patch(ENDPOINTS.notifications.markRead(id));
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store notification markAsRead ${id}`, e);
        const notif = localNotifications.find(n => n.id === id);
        if (notif) notif.read = true;
        return;
      }
      throw createBackendUnavailableError('Notification updates', e);
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.patch(ENDPOINTS.notifications.markAllRead);
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store notifications markAllRead', e);
        localNotifications.forEach(n => {
          n.read = true;
        });
        return;
      }
      throw createBackendUnavailableError('Notification updates', e);
    }
  }
};
