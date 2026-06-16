import { Injectable, inject, Injector, NgZone } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly injector = inject(Injector);
  private readonly swPush = inject(SwPush);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  private readonly vapidPublicKey = 'BL4pjur60RSnA1DZvUHE02-AWUSubpmWrkGEgrcSXK3qSByOhdxB2eCQmBGil30bv9cHyZtLMB-6iO_niogKzmA';

  /**
   * Indicates whether the browser SUPPORTS push notifications.
   *
   * On iOS Safari 16.4+, PushManager exists but ONLY works
   * when the PWA is installed on the Home Screen (standalone mode).
   * In regular Safari, returns false even though PushManager exists.
   */
  get isSupported(): boolean {
    if (!('Notification' in globalThis) || !('PushManager' in globalThis)) {
      return false;
    }
    // iOS: requires standalone mode (PWA installed on Home Screen)
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const standalone = 'standalone' in navigator && (navigator as any).standalone === true;
      const displayMode = globalThis.matchMedia('(display-mode: standalone)').matches;
      return standalone || displayMode;
    }
    return true;
  }

  get subscription$() {
    return this.swPush.subscription;
  }

  get notificationClicks$() {
    return this.swPush.notificationClicks;
  }

  constructor() {
    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      this.zone.run(() => {
        const url = notification.data?.url;
        if (url) {
          this.router.navigateByUrl(url);
        }
      });
    });
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
      // Wait for the service worker to be ready
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return { ok: false, error: 'Service Worker no disponible' };

      let sub: PushSubscription | null = null;

      // Try to get existing subscription first
      try {
        sub = await reg.pushManager.getSubscription();
      } catch {
        // ignore
      }

      // If no subscription, create one using native Push API (more reliable on iOS)
      if (!sub) {
        try {
          const appServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appServerKey as unknown as BufferSource,
          });
        } catch (e: any) {
          console.error('[Push] subscribe error:', e);
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

  async unsubscribe(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/push/unsubscribe`, {
          body: { endpoint },
        }),
      );
    } catch {
      // best-effort cleanup on logout
    }
  }

  /**
   * Convert VAPID key from base64url to Uint8Array for the Push API.
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
