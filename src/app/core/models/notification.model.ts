export type NotificationType = 'new-order' | 'order-status-changed' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
  data?: any;
}
