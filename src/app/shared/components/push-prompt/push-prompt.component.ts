import { Component, inject, signal, effect, OnInit } from '@angular/core';
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
          @if (isIOS()) {
            <!-- iOS: Instalar como app -->
            <div class="push-icon-wrap">📲</div>
            <strong>Instala TuSuper en tu iPhone</strong>
            <p>Toca <span class="ios-icon">{{ iosShareIcon() }}</span> y luego "Agregar a inicio" para recibir notificaciones</p>
          } @else {
            <!-- Android/Desktop: Push nativo -->
            <div class="push-icon-wrap">🔔</div>
            <strong>¿Recibir notificaciones de tus pedidos?</strong>
            <p>Te avisaremos cuando tu pedido esté listo para despachar</p>
          }
          <div class="push-actions">
            <button class="btn-secondary" (click)="dismiss()">Ahora no</button>
            <button class="btn-primary" (click)="accept()">
              {{ isIOS() ? 'Entendido' : 'Activar' }}
            </button>
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
      padding: 24px; animation: fadeIn 0.3s ease;
    }
    .push-prompt-card {
      background: #fff; border-radius: 20px;
      padding: 28px 24px 20px; max-width: 360px; width: 100%;
      text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      animation: cardUp 0.35s ease;
    }
    .push-icon-wrap { font-size: 48px; margin-bottom: 12px; }
    .push-prompt-card strong { display: block; font-size: 17px; color: #1a1a1a; margin-bottom: 8px; }
    .push-prompt-card p { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 20px; }
    .ios-icon { background: #e5e7eb; border-radius: 6px; padding: 2px 8px; font-size: 13px; color: #1a1a1a; }
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
  iosShareIcon = signal('↗️');

  private readonly DISMISSED_KEY = 'push_prompt_dismissed';

  ngOnInit(): void {
    // Detectar iOS
    const ua = navigator.userAgent || '';
    this.isIOS.set(/iPhone|iPad|iPod/.test(ua));
    // iOS usa el ícono de compartir
    if (this.isIOS()) {
      this.iosShareIcon.set(/OS 1[5-9]|OS 2[0-9]/.test(ua) ? '⎋' : '↗️');
    }

    // Mostrar después de 3 segundos si no se ha descartado antes
    if (!localStorage.getItem(this.DISMISSED_KEY)) {
      setTimeout(() => {
        if (this.pushService.isSupported || this.isIOS()) {
          this.visible.set(true);
        }
      }, 3000);
    }
  }

  dismiss(): void {
    this.visible.set(false);
    localStorage.setItem(this.DISMISSED_KEY, '1');
  }

  async accept(): Promise<void> {
    if (this.isIOS()) {
      this.dismiss();
      return;
    }
    this.visible.set(false);
    await this.pushService.requestPermission();
    if (Notification.permission === 'granted') {
      this.pushService.subscribe().catch(() => {});
    }
    localStorage.setItem(this.DISMISSED_KEY, '1');
  }
}
