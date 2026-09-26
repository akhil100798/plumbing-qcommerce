import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem } from '../../services/notifications/notificationRepository';

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  notifications: [
    {
      id: 'n1',
      title: 'Order Confirmed 📦',
      body: 'Your order #PC-987654 for CPVC Elbow Joint has been confirmed and is being packed.',
      time: '2 mins ago',
      read: false,
      category: 'order',
    },
    {
      id: 'n2',
      title: 'Special Coupon for You! 🏷️',
      body: 'Use code "PLUMB50" to get 50% discount on your first plumber booking fee.',
      time: '2 hours ago',
      read: false,
      category: 'promo',
    },
    {
      id: 'n3',
      title: 'System Maintenance Alert 🛠️',
      body: 'The server will undergo minor upgrades tonight from 2 AM to 3 AM. App access may be intermittent.',
      time: '1 day ago',
      read: true,
      category: 'system',
    },
  ],
  unreadCount: 2,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.notifications.find((n) => n.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, markAsRead, markAllRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
