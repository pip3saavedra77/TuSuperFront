import { Component, input, output } from '@angular/core';
import { Category } from '../../../../../core/models/product.model';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  template: `
    <div class="category-strip">
      @for (cat of categories(); track cat.id) {
        <button class="category-chip" (click)="categorySelect.emit(cat.id)">

          <span class="category-chip__label">{{ cat.name }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .category-strip { display: flex; gap: 12px; overflow-x: auto; padding: 4px 0; scrollbar-width: none; -ms-overflow-style: none; }
    .category-strip::-webkit-scrollbar { display: none; }
    .category-chip { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px; padding: 16px 12px; border-radius: 24px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); cursor: pointer; transition: border-color 0.2s, background 0.2s; flex-shrink: 0; }
    .category-chip:hover { border-color: rgba(0, 200, 83, 0.5); background: rgba(255, 255, 255, 0.7); }
    .category-chip__icon { font-size: 28px; color: var(--tusuper-primary); }
    .category-chip__label { font-size: 12px; font-family: var(--tusuper-font-label); color: var(--tusuper-on-surface); text-transform: capitalize; white-space: nowrap; }
  `],
})
export class CategoryStripComponent {
  readonly categories = input.required<Category[]>();
  readonly categorySelect = output<number>();
}
