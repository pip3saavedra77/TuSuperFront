import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
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

  async subscribe(): Promise<{ ok: boolean; error?: string }> {
    if (!this.isSupported) return { ok: false, error: 'Navegador no soporta notificaciones' };
    if (Notification.permission !== 'granted') return { ok: false, error: 'Permiso no concedido: ' + Notification.permission };

    try {
      // Registrar el SW si no está activo
      if (!navigator.serviceWorker.controller) {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          await new Promise<void>((resolve) => {
            if (reg.active) return resolve();
            const onUpdate = () => { reg.removeEventListener('updatefound', onUpdate); resolve(); };
            reg.addEventListener('updatefound', onUpdate);
            setTimeout(resolve, 5000); // timeout de respaldo
          });
        } catch (e: any) {
          return { ok: false, error: 'SW no se pudo registrar: ' + (e.message || 'desconocido') };
        }
      }

      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        return { ok: false, error: 'Service Worker no disponible' };
      }

      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        try {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as unknown as BufferSource,
          });
        } catch (e: any) {
          return { ok: false, error: 'Error al suscribir Push: ' + (e.message || 'desconocido') };
        }
      }

      const json = sub.toJSON();
      const payload = { endpoint: json.endpoint!, keys: json.keys as { p256dh: string; auth: string } };

      try {
        await firstValueFrom(this.http.post(`${environment.apiUrl}/push/subscribe`, payload));
      } catch (e: any) {
        return { ok: false, error: 'Error al registrar en servidor: ' + (e.status || e.message || 'sin conexion') };
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Error desconocido' };
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
