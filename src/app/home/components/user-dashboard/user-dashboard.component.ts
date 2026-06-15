import { Component, OnInit, inject, computed, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth';
import { OrdersService } from '../../../orders/services/orders.service';
import { ProductService } from '../../../product/services/product.service';
import { CartStore } from '../../../product/store/cart.store';
import { Router, RouterLink } from '@angular/router';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product, Category } from '../../../core/models/product.model';
import { PageHeader } from '../../../shared/components/page-header/page-header';

interface OrderStatusPercentages { delivered: number; transit: number; cancelled: number; }

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatSnackBarModule, PageHeader],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
})
export class UserDashboardComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly ordersService = inject(OrdersService);
  readonly auth = inject(AuthService);
  readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser = this.auth.currentUser;
  readonly isUser = this.auth.isUser;
  private readonly snackBar = inject(MatSnackBar);

  readonly featuredProducts = signal<Product[]>([]);
  readonly justAddedIds = signal<Set<number>>(new Set());
  readonly categories = signal<Category[]>([]);
  readonly myOrders = signal<Order[]>([]);
  readonly loading = signal(true);

  readonly monthlyOrdersCount = computed(() => this.myOrders().length);
  readonly monthlyGoalPercent = computed(() => Math.min(100, Math.round((this.myOrders().length / 20) * 100)));

  readonly pendingOrdersUserCount = computed(() =>
    this.myOrders().filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).length
  );

  readonly totalSpent = computed(() =>
    this.myOrders().filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.PENDING).reduce((acc, o) => acc + Number(o.totalAmount ?? 0), 0)
  );

  readonly orderStatusPct = computed((): OrderStatusPercentages => {
    const orders = this.myOrders();
    if (!orders.length) return { delivered: 0, transit: 0, cancelled: 0 };
    const total = orders.length;
    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
    const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
    const transit = total - delivered - cancelled;
    return { delivered: Math.round((delivered / total) * 100), transit: Math.round((transit / total) * 100), cancelled: Math.round((cancelled / total) * 100) };
  });

  readonly recentOrders = computed(() => this.myOrders().slice(0, 2));
  readonly unreadCount = computed(() => 0);

  ngOnInit(): void { this.loadDashboard(); }

  private loadDashboard(): void {
    this.loading.set(true);
    forkJoin({
      orders: this.ordersService.getMyOrders({ limit: 5, offset: 0 }).pipe(catchError(() => of({ data: [], total: 0, limit: 5, offset: 0 }))),
      products: this.productService.getAll({ limit: 4, offset: 0 }).pipe(catchError(() => of({ data: [], total: 0, limit: 4, offset: 0 }))),
      categories: this.productService.getCategories().pipe(catchError(() => of({ data: [], total: 0, limit: 4, offset: 0 }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ orders, products, categories }) => {
      this.myOrders.set(orders.data);
      this.featuredProducts.set(products.data);
      this.categories.set(categories.data);
      this.loading.set(false);
    });
  }

  navigateToCategory(id: number): void { this.router.navigate(['/product'], { queryParams: { category: id } }); }

  onAddToCart(product: Product): void {
    this.cartStore.addItem(product);
    this.cartStore.openCart();
    this.snackBar.open(`${product.name} agregado al carrito`, 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });

    // Feedback visual temporal en la tarjeta
    this.justAddedIds.update(set => {
      const next = new Set(set);
      next.add(product.id);
      return next;
    });
    setTimeout(() => {
      this.justAddedIds.update(set => {
        const next = new Set(set);
        next.delete(product.id);
        return next;
      });
    }, 1200);
  }

  isJustAdded(product: Product): boolean {
    return this.justAddedIds().has(product.id);
  }

  navigatePromo(): void { this.router.navigate(['/product'], { queryParams: { category: 'frutas' } }); }
  onCartClick(): void { this.router.navigateByUrl('/product').then(() => this.cartStore.openCart()); }
  onSearchClick(): void { this.router.navigateByUrl('/product'); }

  /**
   * Mapea el nombre de una categoría a un icono de Material Symbols.
   */
  categoryIcon(name: string): string {
    const map: Record<string, string> = {
      frutas: 'nutrition',
      verduras: 'eco',
      lácteos: 'egg_alt',
      lacteos: 'egg_alt',
      panadería: 'bakery_dining',
      panaderia: 'bakery_dining',
      bebidas: 'local_cafe',
      carnes: 'restaurant',
      grano: 'grain',
      limpieza: 'cleaning_services',
      otros: 'category',
    };
    const key = name?.toLowerCase().trim() ?? '';
    return map[key] ?? 'category';
  }
}
