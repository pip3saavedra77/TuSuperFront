import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Notification, NotificationType } from '../models/notification.model';
import { environment } from '../../../environments/environment';
import { SoundService } from './sound.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private socket: Socket | null = null;
  private readonly apiUrl = environment.apiUrl;
  private readonly sound = inject(SoundService);

  // State
  private readonly notifications = signal<Notification[]>(this.loadFromStorage());
  private readonly _orderStatusChanged = new Subject<any>();
  private readonly _newOrderReceived = new Subject<any>();

  readonly allNotifications = this.notifications.asReadonly();
  readonly orderStatusChanged$ = this._orderStatusChanged.asObservable();
  readonly newOrderReceived$ = this._newOrderReceived.asObservable();
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length,
  );

  constructor() {
    this.connect();
  }

  connect(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('NotificationsService: No token found, skipping socket connection');
      return;
    }

    if (this.socket?.connected) return;

    this.socket = io(this.apiUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to notifications gateway');
      this.socket?.emit('authenticate', { token });
    });

    this.socket.on('new-order', (data: string) => {
      this.sound.playNewOrder();
      this.addNotification({
        id: Math.random().toString(36).substring(2, 11),
        title: '¡Nuevo Pedido!',
        message: data,
        type: 'new-order',
        timestamp: new Date().toISOString(),
        isRead: false,
        data,
      });
      this._newOrderReceived.next(data);
    });

    this.socket.on('new_order', (data: string) => {
      this.sound.playNewOrder();
      this.addNotification({
        id: Math.random().toString(36).substring(2, 11),
        title: '¡Nuevo Pedido!',
        message: data,
        type: 'new-order',
        timestamp: new Date().toISOString(),
        isRead: false,
        data,
      });
      this._newOrderReceived.next(data);
    });

    this.socket.on('order-status-changed', (data: any) => {
      this.sound.playStatusChange();
      this.addNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: 'Actualización de Pedido',
        message: `El pedido #${data.orderId} cambió a ${data.newStatus}`,
        type: 'order-status-changed',
        timestamp: new Date().toISOString(),
        isRead: false,
        data,
      });
      this._orderStatusChanged.next(data);
    });

    this.socket.on('order-cancelled', (data: any) => {
      this.sound.playNewOrder();
      this.addNotification({
        id: Math.random().toString(36).substring(2, 11),
        title: 'Pedido Cancelado',
        message: `El cliente ${data.customerName} canceló el pedido #${data.orderId} por $${data.total}`,
        type: 'order-cancelled' as any,
        timestamp: new Date().toISOString(),
        isRead: false,
        data,
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notifications gateway');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifications.set([]);
    localStorage.removeItem('tusuper_notifications');
  }

  private addNotification(notification: Notification): void {
    this.notifications.update((prev) => [notification, ...prev].slice(0, 20));
    this.saveToStorage();
  }

  private loadFromStorage(): Notification[] {
    try {
      const raw = localStorage.getItem('tusuper_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('tusuper_notifications', JSON.stringify(this.notifications()));
    } catch { /* storage full */ }
  }

  markAsRead(id: string): void {
    this.notifications.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.saveToStorage();
  }

  markAllAsRead(): void {
    this.notifications.update((prev) => prev.map((n) => ({ ...n, isRead: true })));
    this.saveToStorage();
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'hace unos segundos';
    if (minutes === 1) return 'hace 1 minuto';
    if (minutes < 60) return `hace ${minutes} minutos`;
    if (hours === 1) return 'hace 1 hora';
    if (hours < 24) return `hace ${hours} horas`;
    if (days === 1) return 'hace 1 día';
    return `hace ${days} días`;
  }
}
