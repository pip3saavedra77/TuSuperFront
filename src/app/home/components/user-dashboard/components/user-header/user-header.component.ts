import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../core/models/auth.models';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="user-header">
      <div class="user-header__top">
        <div class="user-header__profile">
          <div class="user-header__avatar">
            @if (user()?.avatarUrl) {
              <img [src]="user()?.avatarUrl ?? ''" [alt]="user()?.firstName ?? 'Usuario'" />
            } @else {
              <span class="user-header__avatar-text">{{ (user()?.firstName ?? 'U').charAt(0) }}{{ (user()?.lastName ?? '').charAt(0) }}</span>
            }
          </div>
          <div class="user-header__info">
            <p class="user-header__name">{{ user()?.firstName }} {{ user()?.lastName }}</p>
            <p class="user-header__role">Cliente</p>
          </div>
        </div>
        <div class="user-header__actions">
          <button class="user-header__icon-btn" aria-label="Notificaciones">
            <span class="material-symbols-outlined">notifications</span>
            @if (unreadCount() > 0) {
              <span class="user-header__badge">{{ unreadCount() }}</span>
            }
          </button>
          <button class="user-header__icon-btn" aria-label="Carrito" (click)="cartClicked.emit()">
            <span class="material-symbols-outlined">shopping_cart</span>
          </button>
        </div>
      </div>
      <div class="user-header__search">
        <span class="material-symbols-outlined user-header__search-icon">search</span>
        <input
          #searchInput
          class="user-header__search-input"
          type="text"
          placeholder="Buscar productos..."
          (keydown.enter)="searchSubmitted.emit(searchInput.value); searchInput.value = ''"
        />
      </div>
    </header>
  `,
  styles: [`
    .user-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255, 255, 255, 0.7); padding: 12px var(--tusuper-content-padding); display: flex; flex-direction: column; gap: 12px; }
    .user-header__top { display: flex; align-items: center; justify-content: space-between; }
    .user-header__profile { display: flex; align-items: center; gap: 12px; }
    .user-header__avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(255, 255, 255, 0.8); flex-shrink: 0; }
    .user-header__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .user-header__avatar-text { font-size: 16px; font-weight: 700; color: var(--tusuper-primary); font-family: var(--tusuper-font-headline); }
    .user-header__info { display: flex; flex-direction: column; }
    .user-header__name { font-size: 16px; font-weight: 600; color: var(--tusuper-on-surface); margin: 0; font-family: var(--tusuper-font-headline); }
    .user-header__role { font-size: 12px; color: var(--tusuper-on-surface-variant); margin: 0; font-family: var(--tusuper-font-label); }
    .user-header__actions { display: flex; align-items: center; gap: 8px; }
    .user-header__icon-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--tusuper-on-surface); transition: background 0.2s; position: relative; }
    .user-header__icon-btn:hover { background: rgba(255, 255, 255, 0.8); }
    .user-header__icon-btn .material-symbols-outlined { font-size: 24px; }
    .user-header__badge { position: absolute; top: -2px; right: -2px; background: var(--tusuper-error); color: #fff; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; font-family: var(--tusuper-font-label); }
    .user-header__search { display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border-radius: 16px; padding: 0 16px; border: 1px solid rgba(255, 255, 255, 0.7); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
    .user-header__search-icon { font-size: 20px; color: var(--tusuper-on-surface-variant); }
    .user-header__search-input { flex: 1; border: none; background: none; padding: 12px 0; font-size: 14px; color: var(--tusuper-on-surface); outline: none; font-family: var(--tusuper-font-body); }
    .user-header__search-input::placeholder { color: var(--tusuper-on-surface-variant); }
  `],
})
export class UserHeaderComponent {
  readonly user = input<User | null>();
  readonly unreadCount = input<number>(0);
  readonly searchSubmitted = output<string>();
  readonly cartClicked = output<void>();
}
