import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrdersService } from '../../services/orders.service';
import {
  Order,
  OrderStatus,
  ORDER_STATUS_LABELS,
  PaginationParams,
} from '../../../core/models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
})
export class MyOrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  readonly displayedColumns: string[] = [
    'id',
    'totalAmount',
    'status',
    'createdAt',
  ];

  ngOnInit(): void {
    this.loadOrders();
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

  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
