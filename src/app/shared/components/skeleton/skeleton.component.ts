import { Component, input } from '@angular/core';

type SkeletonVariant = 'card' | 'stat' | 'order' | 'circle' | 'text';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="skeleton" [class]="'skeleton--' + variant()"></div>`,
  styles: [`
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.5) 50%,
        rgba(255, 255, 255, 0.1) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: var(--tusuper-radius-card);
      overflow: hidden;
    }

    .skeleton--card   { height: 280px; }
    .skeleton--stat   { height: 180px; }
    .skeleton--order  { height: 72px; border-radius: var(--tusuper-radius-order-card); }
    .skeleton--circle { width: 80px; height: 80px; border-radius: 50%; }
    .skeleton--text   { height: 16px; width: 60%; }
  `],
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('card');
}
