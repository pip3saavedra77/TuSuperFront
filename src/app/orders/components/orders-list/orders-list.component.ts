import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
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
import { AuthService } from '../../../core/services/auth';
import { NotificationsService } from '../../../core/services/notifications.service';

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
    MatMenuModule,
    MatChipsModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  public readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationsService = inject(NotificationsService);

  readonly orders = signal<Order[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Search & Side Drawer State ──────────────────────
  readonly searchQuery = signal<string>('');
  readonly selectedOrder = signal<Order | null>(null);
  readonly drawerOpen = signal<boolean>(false);
  readonly updatingStatus = signal<boolean>(false);
  drawerSelectedStatus: OrderStatus | null = null;

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
    'createdAt',
    'totalAmount',
    'status',
    'actions',
  ];

  readonly statusOptions = Object.values(OrderStatus);
  readonly statusLabels = ORDER_STATUS_LABELS;

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentOffset.set(0);
        this.loadOrders();
      });
  }

  ngOnInit(): void {
    this.loadOrders();
    this.setupWebSocketRefresh();
  }

  private setupWebSocketRefresh(): void {
    this.notificationsService.newOrderReceived$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders());
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

    const query = this.searchQuery().trim();
    if (query) {
      filters.search = query;
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

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
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

  getTransitions(status: OrderStatus): readonly OrderStatus[] {
    return getValidTransitions(status);
  }

  isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
    return this.getTransitions(current).includes(target);
  }

  viewDetails(order: Order): void {
    this.selectedOrder.set(order);
    this.drawerSelectedStatus = order.status;
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  cancelOrder(order: Order): void {
    if (confirm(`¿Estás seguro de que deseas cancelar el pedido #${order.id}?`)) {
      this.executeStatusChange(order.id, OrderStatus.CANCELLED);
    }
  }

  executeStatusChange(orderId: number, newStatus: OrderStatus): void {
    this.updatingStatus.set(true);

    this.ordersService
      .updateOrderStatus(orderId, newStatus)
      .pipe(
        finalize(() => this.updatingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedOrder) => {
          this.snackBar.open('Estado actualizado correctamente', 'Cerrar', {
            duration: 3000,
          });

          // Sincronizar selectedOrder en caliente
          const current = this.selectedOrder();
          if (current?.id === orderId) {
            this.selectedOrder.set({ ...current, status: newStatus });
          }
          this.drawerSelectedStatus = newStatus;

          this.loadOrders();
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
          // Revertir el valor del select si la petición falló
          const current = this.selectedOrder();
          this.drawerSelectedStatus = current?.status ?? null;
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
