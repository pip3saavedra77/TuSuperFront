import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CartStore } from '../../store/cart.store';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);

  onIncrease(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      this.cartStore.updateQuantity(item.product.id, item.quantity + 1);
    }
  }

  onDecrease(item: CartItem): void {
    if (item.quantity <= 1) {
      this.cartStore.removeItem(item.product.id);
      return;
    }
    this.cartStore.updateQuantity(item.product.id, item.quantity - 1);
  }

  onRemove(productId: number): void {
    this.cartStore.removeItem(productId);
  }

  onClearCart(): void {
    this.cartStore.clearCart();
  }

  onPlaceOrder(): void {
    if (this.cartStore.isEmpty()) return;
    this.router.navigate(['/orders/checkout']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = img.parentElement;
    if (container) {
      img.remove();
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = 'inventory_2';
      container.appendChild(icon);
    }
  }
}
