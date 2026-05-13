import {
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CartStore } from '../../store/cart.store';
import { CartItem } from '../../models/cart.model';
import { OrdersService } from '../../../orders/services/orders.service';
import { CreateOrderPayload } from '../../../core/models/order.model';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './cart-panel.component.html',
  styleUrl: './cart-panel.component.scss',
})
export class CartPanelComponent {
  readonly cartStore = inject(CartStore);
  private readonly ordersService = inject(OrdersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  onIncrease(item: CartItem): void {
    if (item.quantity < item.product.stock) {
      this.cartStore.updateQuantity(item.product.id, item.quantity + 1);
    }
  }

  onDecrease(item: CartItem): void {
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
}
