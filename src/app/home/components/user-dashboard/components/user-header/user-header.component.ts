import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../core/models/auth.models';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="user-header">
      <div class="user-header__profile">
        <div class="user-header__avatar">
          @if (user()?.avatarUrl) {
            <img [src]="user()?.avatarUrl ?? ''" [alt]="user()?.firstName ?? 'Usuario'" />
          } @else {
            <span class="user-header__avatar-text">{{ (user()?.firstName ?? 'U').charAt(0) }}{{ (user()?.lastName ?? '').charAt(0) }}</span>
          }
        </div>
        <h1 class="user-header__brand">Tu Super</h1>
      </div>
      <div class="user-header__actions">
        <button class="user-header__icon-btn" aria-label="Buscar" (click)="searchClicked.emit()">
          <span class="material-symbols-outlined">search</span>
        </button>
        <button class="user-header__icon-btn user-header__icon-btn--notif" aria-label="Notificaciones">
          <span class="material-symbols-outlined">notifications</span>
          @if (unreadCount() > 0) {
            <span class="user-header__badge">{{ unreadCount() }}</span>
          }
        </button>
        <button class="user-header__icon-btn" aria-label="Carrito" (click)="cartClicked.emit()">
          <span class="material-symbols-outlined">shopping_basket</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .user-header {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.7);
      padding: 12px var(--tusuper-content-padding, 16px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--tusuper-header-height, 64px);
    }
    .user-header__profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-header__avatar {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.8);
      flex-shrink: 0;
    }
    .user-header__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-header__avatar-text {
      font-size: 16px;
      font-weight: 700;
      color: var(--tusuper-primary, #006e2a);
      font-family: var(--tusuper-font-headline, sans-serif);
    }
    .user-header__brand {
      font-size: 20px;
      font-weight: 700;
      color: var(--tusuper-primary, #006e2a);
      margin: 0;
      font-family: var(--tusuper-font-headline, sans-serif);
      letter-spacing: -0.01em;
    }
    .user-header__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .user-header__icon-btn {
      width: 44px; height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--tusuper-on-surface-variant, #3c4a3c);
      transition: background 0.2s, color 0.2s;
      position: relative;
      padding: 0;
    }
    .user-header__icon-btn:hover {
      background: rgba(255, 255, 255, 0.8);
      color: var(--tusuper-primary, #006e2a);
    }
    .user-header__icon-btn .material-symbols-outlined {
      font-size: 24px;
    }
    .user-header__badge {
      position: absolute;
      top: 2px; right: 2px;
      background: var(--tusuper-error, #ba1a1a);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      min-width: 16px; height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      font-family: var(--tusuper-font-label, monospace);
    }
  `],
})
export class UserHeaderComponent {
  readonly user = input<User | null>();
  readonly unreadCount = input<number>(0);
  readonly searchClicked = output<void>();
  readonly cartClicked = output<void>();
}
