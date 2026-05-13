import { Component, inject, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CartStore } from '../../../product/store/cart.store';
import { OrdersService } from '../../services/orders.service';
import { CreateOrderPayload } from '../../../core/models/order.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent {
  public readonly cartStore = inject(CartStore);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  public readonly checkoutForm: FormGroup;
  public readonly displayedColumns: string[] = ['image', 'product', 'price', 'quantity', 'subtotal'];
  
  public isProcessing = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      deliveryAddress: ['', [Validators.required, Validators.minLength(5)]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]+$/)]],
      paymentMethod: ['', [Validators.required]],
    });

    // Redirigir si el carrito está vacío al entrar
    effect(() => {
      if (this.cartStore.isEmpty()) {
        this.router.navigate(['/product']);
      }
    });
  }

  confirmOrder(): void {
    if (this.cartStore.isEmpty() || this.checkoutForm.invalid) return;

    this.isProcessing = true;
    const formValues = this.checkoutForm.value;
    
    const payload: CreateOrderPayload = {
      ...formValues,
      items: this.cartStore.items().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    this.ordersService.createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.snackBar.open('¡Pedido realizado con éxito!', 'Cerrar', { duration: 3000 });
          this.cartStore.clearCart();
          this.router.navigate(['/orders/my-orders']);
        },
        error: (err) => {
          this.isProcessing = false;
          this.snackBar.open('Error al crear el pedido. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
        }
      });
  }
}
