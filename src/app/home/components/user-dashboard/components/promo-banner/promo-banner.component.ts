import { Component, output } from '@angular/core';

@Component({
  selector: 'app-promo-banner',
  standalone: true,
  template: `
    <div class="promo-banner" (click)="action.emit()" (keydown.enter)="action.emit()" tabindex="0" role="button" aria-label="Ver promocion de frutas">
      <div class="promo-banner__text">
        <span class="promo-banner__badge">20% OFF</span>
        <p class="promo-banner__title">Frutas frescas</p>
        <p class="promo-banner__subtitle">Directo del campo a tu mesa</p>
      </div>
      <div class="promo-banner__icon">
        <span class="material-symbols-outlined">nutrition</span>
      </div>
    </div>
  `,
  styles: [`
    .promo-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(0, 200, 83, 0.25), rgba(0, 200, 83, 0.08));
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(0, 200, 83, 0.3);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      border-radius: 24px;
      padding: 20px 24px;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.2s;
    }
    .promo-banner:hover { border-color: rgba(0, 200, 83, 0.6); }
    .promo-banner__badge { display: inline-block; background: var(--tusuper-primary); color: var(--tusuper-on-primary); font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; font-family: var(--tusuper-font-label); }
    .promo-banner__title { font-size: 22px; font-weight: 700; color: var(--tusuper-on-surface); margin: 0 0 4px; font-family: var(--tusuper-font-headline); }
    .promo-banner__subtitle { font-size: 14px; color: var(--tusuper-on-surface-variant); margin: 0; }
    .promo-banner__icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.6); }
    .promo-banner__icon .material-symbols-outlined { font-size: 32px; color: var(--tusuper-primary); }
  `],
})
export class PromoBannerComponent {
  readonly action = output<void>();
}
