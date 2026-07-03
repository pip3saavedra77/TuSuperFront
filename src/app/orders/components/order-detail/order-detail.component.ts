import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrdersService } from '../../services/orders.service';
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  getValidTransitions,
} from '../../../core/models/order.model';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly snackBar = inject(MatSnackBar);
  public readonly auth = inject(AuthService);

  @Input({ required: true }) order!: Order;
  @Output() close = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<{ orderId: number; status: OrderStatus }>();

  readonly updating = signal(false);
  selectedStatus: OrderStatus | null = null;

  readonly OrderStatus = OrderStatus;
  readonly statusOptions = Object.values(OrderStatus);
  readonly statusLabels = ORDER_STATUS_LABELS;

  ngOnInit(): void {
    this.selectedStatus = this.order.status;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

  getTransitions(status: OrderStatus): readonly OrderStatus[] {
    return getValidTransitions(status);
  }

  isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
    return this.getTransitions(current).includes(target);
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  isTerminal(status: OrderStatus): boolean {
    return this.getTransitions(status).length === 0;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  executeStatusChange(newStatus: OrderStatus): void {
    this.updating.set(true);

    this.ordersService
      .updateOrderStatus(this.order.id, newStatus)
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Pedido #${this.order.id} → ${this.getStatusLabel(newStatus)}`,
            'Cerrar',
            { duration: 3000 },
          );
          this.selectedStatus = newStatus;
          this.statusChanged.emit({ orderId: this.order.id, status: newStatus });
        },
        error: (err: HttpErrorResponse) => {
          this.selectedStatus = this.order.status;
          const message =
            (err.error as { message?: string })?.message ??
            'Error al actualizar el estado';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        },
      });
  }

  cancelOrder(): void {
    if (confirm(`¿Estás seguro de cancelar el pedido #${this.order.id}?`)) {
      this.executeStatusChange(OrderStatus.CANCELLED);
    }
  }
}
