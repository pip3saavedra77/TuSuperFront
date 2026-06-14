import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private vapidPublicKey = 'BL055Pmv0P7ncLoKzQxhBqBRkcZwnNBSeT2-K_tbomnTU0RYSmb9bhpncI9oY8fiPlOAm7HdS4j4UyU_cRSbRkE';

  constructor(private http: HttpClient) {}

  /** Retorna true si el navegador soporta notificaciones push */
  get isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /** Pide permiso — debe llamarse dentro de un user gesture (click) */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  /** Suscribe al Push Manager y registra en el backend */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as unknown as BufferSource,
        });
      }

      const sub = subscription.toJSON();
      const endpoint = sub.endpoint!;
      const keys = sub.keys as { p256dh: string; auth: string };

      this.http.post(`${environment.apiUrl}/push/subscribe`, { endpoint, keys }).subscribe();
      return true;
    } catch {
      return false;
    }
  }

  private urlBase64ToUint8Array(base64: string): Uint8Array {
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
}
