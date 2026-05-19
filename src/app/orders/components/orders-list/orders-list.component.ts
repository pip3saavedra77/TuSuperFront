import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { provideNativeDateAdapter } from '@angular/material/core';

import { OrdersService } from '../../services/orders.service';
import {
  Order,
  OrderFilterParams,
  OrderStatus,
  ORDER_STATUS_LABELS,
  getValidTransitions,
  isTerminalStatus,
} from '../../../core/models/order.model';
import {
  ChangeStatusDialogComponent,
  ChangeStatusDialogData,
} from './change-status-dialog.component';
import { AuthService } from '../../../core/services/auth';

export interface TabOption {
  label: string;
  status: OrderStatus | '';
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  filterStatus: OrderStatus | '' = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  readonly tabOptions: TabOption[] = [
    { label: 'Todos', status: '' },
    { label: 'Pendientes', status: OrderStatus.PENDING },
    { label: 'Preparando', status: OrderStatus.PREPARING },
    { label: 'Listos para despacho', status: OrderStatus.READY_FOR_DISPATCH },
    { label: 'Despachados', status: OrderStatus.DISPATCHED },
    { label: 'Entregados', status: OrderStatus.DELIVERED },
    { label: 'Cancelados', status: OrderStatus.CANCELLED },
  ];

  selectedTabIndex = 0;

  readonly displayedColumns: string[] = [
    'id',
    'customer',
    'totalAmount',
    'createdAt',
    'actions',
  ];

  readonly statusOptions = Object.values(OrderStatus);
  readonly statusLabels = ORDER_STATUS_LABELS;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);

    const filters: OrderFilterParams = {
      limit: this.currentLimit(),
      offset: this.currentOffset(),
    };

    if (this.filterStatus) {
      filters.status = this.filterStatus;
    }
    if (this.filterStartDate) {
      filters.startDate = this.filterStartDate;
    }
    if (this.filterEndDate) {
      filters.endDate = this.filterEndDate;
    }

    this.ordersService
      .getAllOrders(filters)
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

  onSearch(): void {
    this.currentOffset.set(0);
    this.loadOrders();
  }

  onClearFilters(): void {
    this.filterStatus = this.tabOptions[this.selectedTabIndex].status;
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.currentOffset.set(0);
    this.loadOrders();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.filterStatus = this.tabOptions[index].status;
    this.currentOffset.set(0);
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadOrders();
  }

  isTerminal(status: OrderStatus): boolean {
    return isTerminalStatus(status);
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  openChangeStatusDialog(order: Order): void {
    const dialogData: ChangeStatusDialogData = {
      orderId: order.id,
      currentStatus: order.status,
      validTransitions: Object.values(OrderStatus).filter(
        (s) => s !== order.status
      ),
    };

    const dialogRef = this.dialog.open(ChangeStatusDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newStatus: OrderStatus | undefined) => {
        if (newStatus) {
          this.executeStatusChange(order.id, newStatus);
        }
      });
  }

  private executeStatusChange(orderId: number, newStatus: OrderStatus): void {
    this.loading.set(true);

    this.ordersService
      .updateOrderStatus(orderId, newStatus)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Estado actualizado correctamente', 'Cerrar', {
            duration: 3000,
          });
          this.loadOrders();
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
