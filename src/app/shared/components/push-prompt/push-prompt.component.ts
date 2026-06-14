import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PushService } from '../../../core/services/push.service';

@Component({
  selector: 'app-push-prompt',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="push-prompt-banner" (click)="accept($event)">
        <div class="push-prompt-content">
          <mat-icon class="push-icon">notifications_active</mat-icon>
          <div class="push-text">
            <strong>¿Recibir notificaciones de tus pedidos?</strong>
            <span>Te avisaremos cuando tu pedido esté listo</span>
          </div>
          <button mat-flat-button color="primary" class="push-accept-btn" (click)="accept($event)">
            Activar
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .push-prompt-banner {
      position: fixed;
      bottom: 16px;
      left: 16px;
      right: 16px;
      z-index: 1000;
      background: #1a1a1a;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      cursor: pointer;
      animation: slideUp 0.4s ease;
    }
    .push-prompt-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .push-icon { color: #22c55e; font-size: 32px; width: 32px; height: 32px; flex-shrink: 0; }
    .push-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .push-text strong { color: #fff; font-size: 14px; line-height: 1.3; }
    .push-text span { color: #a1a1aa; font-size: 12px; white-space: normal; }
    .push-accept-btn { flex-shrink: 0; --mdc-filled-button-container-color: #22c55e; }

    @keyframes slideUp {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (min-width: 768px) {
      .push-prompt-banner { left: 50%; right: auto; transform: translateX(-50%); max-width: 420px; width: 100%; }
      @keyframes slideUp {
        from { transform: translate(-50%, 100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    }
  `]
})
export class PushPromptComponent {
  private pushService = inject(PushService);
  visible = signal(false);

  show(): void {
    if (this.pushService.isSupported && Notification.permission === 'default') {
      this.visible.set(true);
    }
  }

  async accept(event: Event): Promise<void> {
    event.stopPropagation();
    this.visible.set(false);
    await this.pushService.requestPermission();
    if (Notification.permission === 'granted') {
      this.pushService.subscribe().catch(() => {});
    }
  }
}
