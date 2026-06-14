import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushService } from '../../../core/services/push.service';

@Component({
  selector: 'app-push-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="push-prompt-overlay" (click)="dismiss()">
        <div class="push-prompt-card" (click)="$event.stopPropagation()">
          @if (isIOSStandalone()) {
            <!-- iOS PWA: ya instalada, pedir permiso real -->
            <div class="push-icon-wrap">🔔</div>
            <strong>Activar notificaciones</strong>
            <p>Permite que TuSuper te avise cuando tu pedido esté listo</p>
          } @else if (isIOS()) {
            <!-- iOS Safari: mostrar instrucciones de instalación -->
            <div class="push-icon-wrap">📲</div>
            <strong>Recibe notificaciones en tu iPhone</strong>
            <p class="ios-steps">Para activar las notificaciones sigue estos pasos:</p>
            <div class="steps-list">
              <div class="step">
                <span class="step-num">1</span>
                <span>Toca <b>Compartir</b> en Safari</span>
                <span class="step-icon">⎋</span>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <span>Desliza y toca <b>"Agregar a inicio"</b></span>
                <span class="step-icon">➕</span>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <span>Abre la app desde tu pantalla de inicio</span>
                <span class="step-icon">🏠</span>
              </div>
            </div>
          } @else {
            <!-- Android / Desktop -->
            <div class="push-icon-wrap">🔔</div>
            <strong>¿Recibir notificaciones de tus pedidos?</strong>
            <p>Te avisaremos cuando tu pedido esté listo para despachar</p>
          }
          <div class="push-actions">
            <button class="btn-secondary" (click)="dismiss()">Ahora no</button>
            @if (isIOSStandalone()) {
              <button class="btn-primary" (click)="accept()">Activar</button>
            } @else if (isIOS()) {
              <button class="btn-primary" (click)="dismiss()">Entendido</button>
            } @else {
              <button class="btn-primary" (click)="accept()">Activar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .push-prompt-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); display: flex;
      align-items: flex-end; justify-content: center;
      padding: 20px; animation: fadeIn 0.3s ease;
    }
    .push-prompt-card {
      background: #fff; border-radius: 20px;
      padding: 28px 24px 20px; max-width: 380px; width: 100%;
      text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      animation: cardUp 0.35s ease;
    }
    .push-icon-wrap { font-size: 48px; margin-bottom: 10px; }
    .push-prompt-card strong { display: block; font-size: 17px; color: #1a1a1a; margin-bottom: 6px; }
    .push-prompt-card > p { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 16px; }
    .ios-steps { margin-bottom: 12px !important; }

    .steps-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; text-align: left; }
    .step { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9fafb; border-radius: 12px; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .step span:nth-child(2) { flex: 1; font-size: 13px; color: #374151; line-height: 1.4; }
    .step b { color: #16a34a; }
    .step-icon { font-size: 18px; flex-shrink: 0; }

    .push-actions { display: flex; gap: 10px; }
    .btn-secondary, .btn-primary {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary { background: #f3f4f6; color: #374151; }
    .btn-secondary:hover { background: #e5e7eb; }
    .btn-primary { background: #22c55e; color: #fff; }
    .btn-primary:hover { background: #16a34a; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cardUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    @media (min-width: 768px) {
      .push-prompt-overlay { align-items: center; }
    }
  `]
})
export class PushPromptComponent implements OnInit {
  private pushService = inject(PushService);
  visible = signal(false);
  isIOS = signal(false);
  isIOSStandalone = signal(false);

  private readonly DISMISSED_KEY = 'push_prompt_dismissed_at';

  private wasRecentlyDismissed(): boolean {
    const raw = localStorage.getItem(this.DISMISSED_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    return (Date.now() - dismissedAt) < 24 * 60 * 60 * 1000;
  }

  private shouldShow(): boolean {
    if (this.wasRecentlyDismissed()) return false;
    if (this.isIOS()) return true;
    return this.pushService.isSupported && Notification.permission !== 'granted';
  }

  ngOnInit(): void {
    localStorage.removeItem('push_prompt_dismissed');

    const ua = navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua);
    const isStandalone = 'standalone' in navigator && (navigator as any).standalone === true;
    const displayMode = window.matchMedia('(display-mode: standalone)').matches;
    const isPWA = isStandalone || displayMode;

    this.isIOS.set(isIOSDevice);
    this.isIOSStandalone.set(isIOSDevice && isPWA);

    setTimeout(() => {
      if (this.shouldShow()) {
        this.visible.set(true);
      }
    }, 3000);
  }

  dismiss(): void {
    this.visible.set(false);
    localStorage.setItem(this.DISMISSED_KEY, Date.now().toString());
  }

  async accept(): Promise<void> {
    this.visible.set(false);
    let result = 'blocked';
    if ('Notification' in window) {
      result = await Notification.requestPermission();
    }
    if (result === 'granted') {
      const ok = await this.pushService.subscribe();
      if (ok) {
        alert('¡Notificaciones activadas! Recibirás avisos cuando tu pedido cambie de estado.');
      } else {
        alert('No se pudo completar la suscripción. Intenta de nuevo más tarde.');
      }
    } else if (result === 'denied') {
      alert('Permiso denegado. Puedes activarlo en Ajustes > Notificaciones > TuSuper.');
    }
    localStorage.setItem(this.DISMISSED_KEY, Date.now().toString());
  }
}
