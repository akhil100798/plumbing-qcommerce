import { apiClient } from '../apiClient';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  category: 'order' | 'promo' | 'system';
}

export const NotificationRepository = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<any[]>('/notifications');
    return response.data.map((n) => ({
      id: String(n.id),
      title: n.title,
      body: n.body,
      time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Just now',
      read: n.read,
      category: n.title.toLowerCase().includes('order')
        ? 'order'
        : n.title.toLowerCase().includes('coupon') || n.title.toLowerCase().includes('promo')
        ? 'promo'
        : 'system',
    }));
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
