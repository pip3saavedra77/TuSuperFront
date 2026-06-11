import {
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CartStore } from '../../store/cart.store';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cart-panel.component.html',
  styleUrl: './cart-panel.component.scss',
})
export class CartPanelComponent {
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  onIncrease(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      this.cartStore.updateQuantity(item.product.id, item.quantity + 1);
    }
  }

  onDecrease(item: CartItem): void {
    if (item.quantity <= 1) return;
    this.cartStore.updateQuantity(item.product.id, item.quantity - 1);
  }

  onRemove(productId: number): void {
    this.cartStore.removeItem(productId);
  }

  onClearCart(): void {
    this.cartStore.clearCart();
  }

  onPlaceOrder(): void {
    const items = this.cartStore.items();
    if (items.length === 0) return;

    this.cartStore.closeCart();
    this.router.navigate(['/orders/checkout']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = img.parentElement;
    if (container) {
      img.remove();
      const icon = document.createElement('mat-icon');
      icon.textContent = 'inventory_2';
      container.appendChild(icon);
    }
  }
}
