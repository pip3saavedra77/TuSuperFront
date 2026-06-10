import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { OrdersService } from '../../services/orders.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  PaginationParams,
} from '../../../core/models/order.model';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
})
export class MyOrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  readonly expandedOrders = signal<Set<number>>(new Set<number>());

  ngOnInit(): void {
    this.loadOrders();
    this.setupWebSocketRefresh();
  }

  private setupWebSocketRefresh(): void {
    this.notificationsService.orderStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadOrders();
      });
  }

  loadOrders(): void {
    this.loading.set(true);
    const pagination: PaginationParams = {
      limit: this.currentLimit(),
      offset: this.currentOffset(),
    };
    this.ordersService
      .getMyOrders(pagination)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.orders.set(result.data);
          this.totalOrders.set(result.total);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadOrders();
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  getStatusClass(status: OrderStatus): string {
    return 'status-' + status.toLowerCase();
  }

  cancelOrder(order: Order): void {
    if (!this.isCancellable(order.status)) {
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Cancelar pedido',
      message: `¿Estás seguro de que deseas cancelar el pedido #${order.id}?\n\nEsta acción restaurará el stock de los productos y no se puede deshacer.`,
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
      icon: 'warning',
    };

    this.dialog
      .open(ConfirmDialogComponent, {
        data,
        disableClose: true,
        maxWidth: '400px',
        width: '90vw',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.ordersService
          .cancelOrder(order.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(
                'Pedido #' + order.id + ' cancelado correctamente. El stock ha sido restaurado.',
                'Cerrar',
                { duration: 4000 },
              );
              this.loadOrders();
            },
            error: (err: HttpErrorResponse) => {
              this.showError(err);
            },
          });
      });
  }

  isCancellable(status: OrderStatus): boolean {
    return status !== OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED;
  }

  toggleExpanded(id: number): void {
    const current = new Set(this.expandedOrders());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedOrders.set(current);
  }

  isExpanded(id: number): boolean {
    return this.expandedOrders().has(id);
  }

  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
