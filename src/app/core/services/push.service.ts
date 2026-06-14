import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private vapidPublicKey = 'BL055Pmv0P7ncLoKzQxhBqBRkcZwnNBSeT2-K_tbomnTU0RYSmb9bhpncI9oY8fiPlOAm7HdS4j4UyU_cRSbRkE';

  constructor(private http: HttpClient) {}

  get isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) { console.log('[Push] No soportado'); return false; }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') { console.log('[Push] Permiso denegado'); return false; }
    const result = await Notification.requestPermission();
    console.log('[Push] requestPermission:', result);
    return result === 'granted';
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported) { console.log('[Push] API no soportada'); return false; }
    if (Notification.permission !== 'granted') { console.log('[Push] Permiso no concedido:', Notification.permission); return false; }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] SW ready, scope:', registration.scope);

      let sub = await registration.pushManager.getSubscription();
      if (sub) {
        console.log('[Push] Ya suscrito:', sub.endpoint);
      } else {
        console.log('[Push] Creando nueva suscripcion...');
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as unknown as BufferSource,
        });
        console.log('[Push] Suscripcion creada:', sub.endpoint);
      }

      const json = sub.toJSON();
      const payload = { endpoint: json.endpoint!, keys: json.keys as { p256dh: string; auth: string } };

      this.http.post(`${environment.apiUrl}/push/subscribe`, payload).subscribe({
        next: () => console.log('[Push] Registrado en backend OK'),
        error: (e) => console.error('[Push] Error al registrar en backend:', e.message),
      });
      return true;
    } catch (e: any) {
      console.error('[Push] Error en subscribe:', e.message, e);
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
