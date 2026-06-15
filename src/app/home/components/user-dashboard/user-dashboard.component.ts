import { Component, OnInit, inject, computed, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { OrdersService } from '../../../orders/services/orders.service';
import { ProductService } from '../../../product/services/product.service';
import { CartStore } from '../../../product/store/cart.store';
import { Router } from '@angular/router';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product, Category } from '../../../core/models/product.model';
import { PromoBannerComponent } from './components/promo-banner/promo-banner.component';
import { CategoryStripComponent } from './components/category-strip/category-strip.component';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { SkeletonGridComponent } from '../../../shared/components/skeleton/skeleton-grid.component';

interface OrderStatusPercentages { delivered: number; transit: number; cancelled: number; }

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, PromoBannerComponent, CategoryStripComponent, UserHeaderComponent, SkeletonComponent, SkeletonGridComponent],
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

  readonly featuredProducts = signal<Product[]>([]);
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
  onAddToCart(product: Product): void { this.cartStore.addItem(product); this.cartStore.openCart(); }
  navigatePromo(): void { this.router.navigate(['/product'], { queryParams: { category: 'frutas' } }); }
  onSearch(q: string): void { this.router.navigate(['/product'], { queryParams: { search: q } }); }
  onCartClick(): void { this.router.navigateByUrl('/product').then(() => this.cartStore.openCart()); }
  onNavChange(tab: string): void { const routes: Record<string, string> = { inicio: '/home', productos: '/product', pedidos: '/orders/my-orders' }; this.router.navigate([routes[tab] ?? '/home']); }
}
