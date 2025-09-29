// frontend/src/types/notification.d.ts
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
  duration?: number; // in milliseconds, default 3000
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: 'success' | 'error' | 'warning', message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}