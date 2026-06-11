import { Component, inject, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    MatSnackBarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
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
  public isProcessing = false;
  private justPlacedOrder = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      deliveryAddress: ['', [Validators.required, Validators.minLength(8)]],
      contactPhone: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
      paymentMethod: ['', [Validators.required]],
      deliveryNotes: [''],
      cashChangeRequested: [null],
    });

    // Redirigir si el carrito está vacío al entrar (excepto justo después de crear pedido)
    effect(() => {
      if (this.cartStore.isEmpty() && !this.justPlacedOrder) {
        this.router.navigate(['/product']);
      }
    });
  }

  confirmOrder(): void {
    if (this.cartStore.isEmpty() || this.checkoutForm.invalid) return;

    this.isProcessing = true;
    const formValues = this.checkoutForm.value;

    const payload: CreateOrderPayload = {
      deliveryAddress: (formValues.deliveryAddress ?? '').trim(),
      contactPhone: (formValues.contactPhone ?? '').trim().replace(/\s+/g, ''),
      paymentMethod: formValues.paymentMethod,
      items: this.cartStore.items().map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      deliveryNotes: (formValues.deliveryNotes ?? '').trim() || undefined,
    };

    if (formValues.cashChangeRequested !== null && formValues.cashChangeRequested !== undefined && formValues.cashChangeRequested !== '') {
      payload.cashChangeRequested = Number(formValues.cashChangeRequested);
    }

    this.ordersService.createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.justPlacedOrder = true;
          this.snackBar.open('¡Pedido realizado con éxito!', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
          this.cartStore.clearCart();
          this.router.navigate(['/orders/my-orders']).then(() => {
            this.isProcessing = false;
          });
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Error al crear el pedido:', err);
          const message = (err.error as { message?: string })?.message ?? 'Error al crear el pedido. Intenta de nuevo.';
          this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        }
      });
  }
}
