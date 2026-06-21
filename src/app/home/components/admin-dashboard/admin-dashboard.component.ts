import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Chart, ChartData, ChartType, ChartOptions, BarController, DoughnutController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../../core/services/auth';
import { UsersService } from '../../../users/services/users.service';
import { DashboardService } from '../../../core/services/dashboard.service';

const MODULE_ICONS: Record<string, string> = {
  users: 'people', modules: 'view_module', product: 'inventory_2',
  category: 'category', provider: 'local_shipping', orders: 'receipt_long',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule, MatProgressSpinnerModule,
    MatButtonModule, BaseChartDirective, TitleCasePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.authService.currentUser;
  readonly userModules = this.authService.userModules;
  readonly isAdmin = this.authService.isAdmin;
  readonly isTendero = this.authService.isTendero;

  readonly pendingOrdersCount = signal<number>(0);
  readonly totalProductsCount = signal<number>(0);
  readonly activeUsersCount = signal<number>(0);
  readonly lowStockCount = signal<number>(0);
  readonly loadingDashboard = signal<boolean>(false);
  readonly selectedCard = signal<string>('kpi-1');

  // Chart configs — copy EXACTLY from current home.ts lines 151-220
  public readonly barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'], datasets: [{ data: [0,0,0,0,0,0,0], label: 'Ventas ($ COP)', backgroundColor: '#3b82f6', hoverBackgroundColor: '#2563eb', borderRadius: 8 }] };
  public readonly barChartOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: '#64748b', font: { family: 'Outfit, sans-serif', size: 12, weight: 'normal' } } } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Outfit, sans-serif' } } }, y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { family: 'Outfit, sans-serif' } } } } };
  public readonly doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = { labels: ['Cargando...'], datasets: [{ data: [1], backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899'], borderWidth: 0 }] };
  public readonly doughnutChartOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right', labels: { color: '#64748b', font: { family: 'Outfit, sans-serif', size: 12 } } } }, cutout: '70%' };

  ngOnInit(): void {
    Chart.register(BarController, DoughnutController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
    this.loadInternalDashboardData();
  }

  private loadInternalDashboardData(): void {
    this.loadingDashboard.set(true);
    forkJoin({
      stats: this.dashboardService.getStats().pipe(
        catchError(() => of({ pendingOrders: 0, totalProducts: 0, lowStock: 0, salesFlow: [0,0,0,0,0,0,0], categoryDistribution: [] }))
      ),
      users: this.isAdmin() ? this.usersService.getUsers({ limit: 1, offset: 0 }).pipe(catchError(() => of({ data: [], total: 0, limit: 1, offset: 0 }))) : of({ data: [], total: 0, limit: 1, offset: 0 }),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ stats, users }) => {
      this.totalProductsCount.set(stats.totalProducts);
      this.pendingOrdersCount.set(stats.pendingOrders);
      this.lowStockCount.set(stats.lowStock);
      this.activeUsersCount.set(users.total);
      const daysOfWeek = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
      const labels: string[] = [];
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); labels.push(daysOfWeek[d.getDay()]); }
      this.barChartData = { labels, datasets: [{ data: stats.salesFlow, label: 'Ventas ($ COP)', backgroundColor: '#3b82f6', hoverBackgroundColor: '#2563eb', borderRadius: 8 }] };
      const catLabels = stats.categoryDistribution.map(cat => cat.name);
      const catData = stats.categoryDistribution.map(cat => cat.value);
      this.doughnutChartData = { labels: catLabels.length > 0 ? catLabels : ['Sin categorizar'], datasets: [{ data: catData.length > 0 ? catData : [0], backgroundColor: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f43f5e','#14b8a6','#64748b'], borderWidth: 0 }] };
      this.loadingDashboard.set(false);
    });
  }

  getIcon(moduleName: string): string { return MODULE_ICONS[moduleName.toLowerCase()] ?? 'extension'; }
  filterValidModules(modules: Set<string>): string[] { const valid = new Set(['users','product','category','provider','orders']); return [...modules].filter((m) => valid.has(m)); }

  /**
   * Ruta de gestión para cada módulo. Separa el catálogo de compra (/product)
   * del panel de gestión (/admin/products).
   */
  getModuleRoute(moduleName: string): string {
    if (moduleName.toLowerCase() === 'product') {
      return '/admin/products';
    }
    return '/' + moduleName.toLowerCase();
  }

  selectCard(cardId: string): void {
    this.selectedCard.set(cardId);
  }
}
