import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { Chart, ChartConfiguration, ChartData, ChartType, ChartOptions, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AuthService } from '../core/services/auth';
import { OrdersService } from '../orders/services/orders.service';
import { ProductService } from '../product/services/product.service';
import { UsersService } from '../users/services/users.service';
import { DashboardService } from '../core/services/dashboard.service';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../core/models/order.model';
import { Product } from '../core/models/product.model';

// Registro global de los módulos y componentes de Chart.js (v4)
Chart.register(...registerables);

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
    MatButtonModule,
    BaseChartDirective,
    TitleCasePipe,
    CurrencyPipe,
    DatePipe,
    NgClass,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly authService      = inject(AuthService);
  private readonly ordersService    = inject(OrdersService);
  private readonly productService   = inject(ProductService);
  private readonly usersService     = inject(UsersService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef       = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly userModules = this.authService.userModules;

  /** Computed reactivos de rol */
  readonly isUserRole = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'USER') ?? false
  );

  readonly isAdminRole = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'ADMIN') ?? false
  );

  readonly isTenderoRole = computed(() =>
    this.currentUser()?.roles.some(r => ['TENDERO', 'TENDER'].includes(r.name.toUpperCase())) ?? false
  );

  /** Último pedido activo del usuario comercial (limit=1) */
  readonly latestOrder = signal<Order | null>(null);

  /** Productos destacados para el widget comercial (limit=4) */
  readonly featuredProducts = signal<Product[]>([]);

  /** Métricas operacionales y globales (optimizadas con limit=1) */
  readonly pendingOrdersCount = signal<number>(0);
  readonly totalProductsCount = signal<number>(0);
  readonly activeUsersCount = signal<number>(0);

  // TODO: Integrar endpoint de bajo stock en backend
  readonly lowStockCount = signal<number>(0);

  /** Loading state unificado del dashboard */
  readonly loadingDashboard = signal<boolean>(false);

  // ── CONFIGURACIÓN DE GRÁFICOS (Chart.js / ng2-charts) ──────────────

  // 1. Gráfico de Barras: Ventas de los últimos 7 días
  public readonly barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        label: 'Ventas ($ COP)',
        backgroundColor: '#3b82f6',
        hoverBackgroundColor: '#2563eb',
        borderRadius: 8,
      }
    ]
  };
  public readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#64748b',
          font: { family: 'Outfit, sans-serif', size: 12, weight: 'normal' }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Outfit, sans-serif' } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { family: 'Outfit, sans-serif' } }
      }
    }
  };

  // 2. Gráfico de Dona: Productos por Categoría
  public readonly doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Cargando...'],
    datasets: [
      {
        data: [1],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 0,
      }
    ]
  };
  public readonly doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#64748b',
          font: { family: 'Outfit, sans-serif', size: 12 }
        }
      }
    },
    cutout: '70%'
  };

  ngOnInit(): void {
    if (this.isUserRole()) {
      this.loadDashboardData();
    } else {
      this.loadInternalDashboardData();
    }
  }

  /**
   * Carga en paralelo el último pedido y los productos destacados (Flujo de rol USER).
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

  /**
   * Carga en paralelo las métricas globales para roles internos (ADMIN/TENDERO) desde el nuevo endpoint.
   */
  private loadInternalDashboardData(): void {
    this.loadingDashboard.set(true);

    forkJoin({
      stats: this.dashboardService.getStats().pipe(
        catchError(() => of({
          pendingOrders: 0,
          totalProducts: 0,
          lowStock: 0,
          salesFlow: [0, 0, 0, 0, 0, 0, 0],
          categoryDistribution: []
        }))
      ),
      users: this.isAdminRole()
        ? this.usersService.getUsers({ limit: 1, offset: 0 }).pipe(
            catchError(() => of({ data: [], total: 0, limit: 1, offset: 0 }))
          )
        : of({ data: [], total: 0, limit: 1, offset: 0 }),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ stats, users }) => {
      this.totalProductsCount.set(stats.totalProducts);
      this.pendingOrdersCount.set(stats.pendingOrders);
      this.lowStockCount.set(stats.lowStock);
      this.activeUsersCount.set(users.total);

      // Actualizar datos de flujo de ventas dinámicamente con los días de la semana correspondientes
      const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const labels: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(daysOfWeek[d.getDay()]);
      }

      this.barChartData = {
        labels,
        datasets: [
          {
            data: stats.salesFlow,
            label: 'Ventas ($ COP)',
            backgroundColor: '#3b82f6',
            hoverBackgroundColor: '#2563eb',
            borderRadius: 8,
          }
        ]
      };

      // Actualizar distribución por categoría
      const catLabels = stats.categoryDistribution.map(cat => cat.name);
      const catData = stats.categoryDistribution.map(cat => cat.value);

      this.doughnutChartData = {
        labels: catLabels.length > 0 ? catLabels : ['Sin categorizar'],
        datasets: [
          {
            data: catData.length > 0 ? catData : [0],
            backgroundColor: [
              '#3b82f6',
              '#10b981',
              '#f59e0b',
              '#8b5cf6',
              '#ec4899',
              '#06b6d4',
              '#f43f5e',
              '#14b8a6',
              '#64748b'
            ],
            borderWidth: 0,
          }
        ]
      };

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
