import { Component, input } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-skeleton-grid',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="skeleton-grid" [class]="'skeleton-grid--' + layout()">
      @for (i of countArray(); track i) {
        <app-skeleton [variant]="variant()" />
      }
    </div>
  `,
  styles: [`
    .skeleton-grid { display: grid; gap: 16px; }
    .skeleton-grid--products { grid-template-columns: repeat(2, 1fr); }
    .skeleton-grid--stats   { grid-template-columns: repeat(2, 1fr); }
    .skeleton-grid--summary { grid-template-columns: repeat(3, 1fr); }
    .skeleton-grid--row     { grid-template-columns: 1fr; }
  `],
})
export class SkeletonGridComponent {
  readonly layout = input<'products' | 'stats' | 'summary' | 'row'>('products');
  readonly count = input<number>(2);
  readonly variant = input<'card' | 'stat' | 'order' | 'circle'>('card');

  countArray(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
