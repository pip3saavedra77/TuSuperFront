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
import { OrderDetailComponent } from '../order-detail/order-detail.component';

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
    OrderDetailComponent,
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
  readonly systemTotalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Search & Modal State ──────────────────────────
  readonly searchQuery = signal<string>('');
  readonly detailModalOrder = signal<Order | null>(null);

  filterStatus: OrderStatus | '' = '';
  filterStartDate: Date | null = null;
  filterEndDate: Date | null = null;

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

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly OrderStatus = OrderStatus;

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── New-order tracking ─────────────────────────────
  private wsNotificationTimes: number[] = [];
  private newOrderTimestamps = new Map<number, number>();

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
    this.loadSystemTotal();
    this.loadOrders();
    this.setupWebSocketRefresh();
  }

  private setupWebSocketRefresh(): void {
    this.notificationsService.newOrderReceived$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.wsNotificationTimes.push(Date.now());
        this.wsNotificationTimes = this.wsNotificationTimes.filter(t => Date.now() - t < 120000);
        this.loadOrders();
      });

    this.notificationsService.orderStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders());
  }

  private loadSystemTotal(): void {
    this.ordersService
      .getAllOrders({ limit: 1, offset: 0 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.systemTotalOrders.set(result.total),
      });
  }

  isPriorityOrder(order: Order): boolean {
    return (
      this.systemTotalOrders() < 10 &&
      (order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING)
    );
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
      filters.startDate = this.formatDate(this.filterStartDate);
    }
    if (this.filterEndDate) {
      filters.endDate = this.formatDate(this.filterEndDate);
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
          this.markNewOrders(result.data);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private markNewOrders(orders: Order[]): void {
    const now = Date.now();
    for (const order of orders) {
      if (order.status !== OrderStatus.PENDING) continue;
      const orderTime = new Date(order.createdAt).getTime();
      const isRecentlyReceived = this.wsNotificationTimes.some(
        t => Math.abs(orderTime - t) < 60000,
      );
      if (isRecentlyReceived && !this.newOrderTimestamps.has(order.id)) {
        this.newOrderTimestamps.set(order.id, now);
      }
    }
    this.cleanExpiredNewOrders();
  }

  private cleanExpiredNewOrders(): void {
    const now = Date.now();
    for (const [id, ts] of this.newOrderTimestamps) {
      if (now - ts > 30000) {
        this.newOrderTimestamps.delete(id);
      }
    }
  }

  isOrderNew(order: Order): boolean {
    return this.newOrderTimestamps.has(order.id) && order.status === OrderStatus.PENDING;
  }

  dismissNewOrder(orderId: number): void {
    this.newOrderTimestamps.delete(orderId);
  }

  // ── Search ────────────────────────────────────────
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  clearDateRange(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.currentOffset.set(0);
    this.loadOrders();
  }

  onClearFilters(): void {
    this.filterStatus = this.tabOptions[this.selectedTabIndex].status;
    this.filterStartDate = null;
    this.filterEndDate = null;
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

  // ── Status helpers ─────────────────────────────────
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

  // ── Modal control ──────────────────────────────────
  openDetailModal(order: Order): void {
    this.dismissNewOrder(order.id);
    this.detailModalOrder.set(order);
    document.body.style.overflow = 'hidden';
  }

  closeDetailModal(): void {
    this.detailModalOrder.set(null);
    document.body.style.overflow = '';
  }

  // ── Quick actions from card ────────────────────────
  quickAction(order: Order, targetStatus: OrderStatus): void {
    this.dismissNewOrder(order.id);
    this.executeStatusChange(order, targetStatus);
  }

  cancelOrder(order: Order): void {
    if (confirm(`¿Estás seguro de que deseas cancelar el pedido #${order.id}?`)) {
      this.dismissNewOrder(order.id);
      this.executeStatusChange(order, OrderStatus.CANCELLED);
    }
  }

  private executeStatusChange(order: Order, newStatus: OrderStatus): void {
    const currentOrders = this.orders();
    const idx = currentOrders.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      currentOrders[idx] = { ...currentOrders[idx], status: newStatus };
      this.orders.set([...currentOrders]);
    }

    if (this.detailModalOrder()?.id === order.id) {
      this.detailModalOrder.set({ ...this.detailModalOrder()!, status: newStatus });
    }

    this.ordersService
      .updateOrderStatus(order.id, newStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Pedido #${order.id} → ${this.getStatusLabel(newStatus)}`,
            'Cerrar',
            { duration: 3000 },
          );
          this.loadOrders();
        },
        error: (err: HttpErrorResponse) => {
          this.loadOrders();
          this.showError(err);
        },
      });
  }

  // ── Modal event handler ────────────────────────────
  onModalStatusChange(event: { orderId: number; status: OrderStatus }): void {
    const match = this.orders().find(o => o.id === event.orderId);
    if (match) {
      this.quickAction(match, event.status);
    }
  }

  // ── Next transition helper for cards ───────────────
  getNextStatus(status: OrderStatus): OrderStatus | null {
    const transitions = this.getTransitions(status);
    const nonCancelled = transitions.filter(s => s !== OrderStatus.CANCELLED);
    return nonCancelled.length > 0 ? nonCancelled[0] : null;
  }

  getNextStatusLabel(status: OrderStatus): string {
    const next = this.getNextStatus(status);
    return next ? this.getStatusLabel(next) : '';
  }

  // ── Error handler ──────────────────────────────────
  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
