import { create } from 'zustand';
import api from '../api/api';
import type { Notification } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications', { params: { limit: 20 } });
      const data = response.data;
      const notifications = Array.isArray(data) ? data : (data?.notifications || []);
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      const notifications = get().notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = Math.max(0, get().unreadCount - 1);
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    const notifications = [notification, ...get().notifications].slice(0, 50);
    set({ 
      notifications, 
      unreadCount: get().unreadCount + 1 
    });
  },

  setUnreadCount: (unreadCount: number) => set({ unreadCount }),
}));
