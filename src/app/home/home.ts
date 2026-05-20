import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../core/services/auth';
import { OrdersService } from '../orders/services/orders.service';
import { ProductService } from '../product/services/product.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../core/models/order.model';
import { Product } from '../core/models/product.model';

const MODULE_ICONS: Record<string, string> = {
  users: 'people',
  roles: 'admin_panel_settings',
  modules: 'widgets',
  product: 'inventory_2',
  category: 'category',
  provider: 'local_shipping',
  orders: 'receipt_long',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe,
    NgClass,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly ordersService  = inject(OrdersService);
  private readonly productService = inject(ProductService);
  private readonly destroyRef     = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly userModules = this.authService.userModules;

  /** Computed reactivo: true si el usuario tiene el rol USER */
  readonly isUserRole = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'USER') ?? false
  );

  /** Último pedido activo del usuario (limit=1) */
  readonly latestOrder = signal<Order | null>(null);

  /** Productos destacados para el widget del dashboard (limit=4) */
  readonly featuredProducts = signal<Product[]>([]);

  /** Loading state unificado del forkJoin */
  readonly loadingDashboard = signal<boolean>(false);

  ngOnInit(): void {
    if (this.isUserRole()) {
      this.loadDashboardData();
    }
  }

  /**
   * Carga en paralelo el último pedido y los productos destacados.
   * catchError en cada rama garantiza que un fallo parcial no bloquee el dashboard completo.
   */
  private loadDashboardData(): void {
    this.loadingDashboard.set(true);

    forkJoin({
      orders: this.ordersService
        .getMyOrders({ limit: 1, offset: 0 })
        .pipe(catchError(() => of({ data: [], total: 0, limit: 1, offset: 0 }))),
      products: this.productService
        .getAll({ limit: 4, offset: 0 })
        .pipe(catchError(() => of({ data: [], total: 0, limit: 4, offset: 0 }))),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ orders, products }) => {
      this.latestOrder.set(orders.data[0] ?? null);
      this.featuredProducts.set(products.data);
      this.loadingDashboard.set(false);
    });
  }

  getIcon(moduleName: string): string {
    return MODULE_ICONS[moduleName.toLowerCase()] ?? 'extension';
  }

  /** Mapea OrderStatus al label en español desde la constante del modelo */
  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }

  /** Mapea OrderStatus a la clase CSS del design system (_order-badges.scss) */
  getStatusClass(status: OrderStatus): string {
    return 'status-' + status.toLowerCase();
  }
}
