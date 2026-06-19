import { Component, inject, computed, OnInit, signal, HostListener, ElementRef, AfterViewInit, DestroyRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';
import { IdleService } from '../../services/idle.service';
import { NotificationsService } from '../../services/notifications.service';
import { CartStore } from '../../../product/store/cart.store';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { PushPromptComponent } from '../../../shared/components/push-prompt/push-prompt.component';
import { CartPanelComponent } from '../../../product/components/cart-panel/cart-panel.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    NotificationBellComponent,
    PushPromptComponent,
    CartPanelComponent,
  ],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  private readonly idleService = inject(IdleService);
  private readonly destroyRef = inject(DestroyRef);
  readonly cartStore = inject(CartStore);

  readonly showExpirationWarning = this.authService.showExpirationWarning;
  readonly idleWarning = this.idleService.idleWarning;

  /** True when page has been scrolled (for nav elevation) */
  readonly navScrolled = signal(false);

  public isAuthenticated = this.authService.isAuthenticated;
  public menuItems = this.authService.userModules;
  public currentUser = this.authService.currentUser;

  constructor() {}

  ngOnInit(): void {
    this.notificationsService.connect();
  }

  ngAfterViewInit(): void {
    // Listen to scroll for nav elevation effect
    const onScroll = () => {
      this.navScrolled.set(window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  public profileClass = computed(() => {
    if (this.authService.isAdmin()) return 'profile-admin';
    if (this.authService.isTendero()) return 'profile-tendero';
    if (this.authService.isUser()) return 'profile-usuario';
    return 'profile-admin';
  });

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public readonly isUser = this.authService.isUser;

  extendSession(): void {
    this.authService.refreshToken().subscribe(() => {
      this.authService.dismissExpirationWarning();
    });
  }

  dismissExpiry(): void {
    this.authService.dismissExpirationWarning();
  }

  dismissIdle(): void {
    this.idleService.dismissWarning();
  }

  logout(): void {
    this.notificationsService.disconnect();
    this.authService.logout();
  }

  /**
   * Etiqueta legible y consistente para cada modúlo del menú lateral.
   */
  getModuleLabel(moduleName: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios',
      product: 'Productos',
      category: 'Categorías',
      provider: 'Proveedores',
      orders: 'Pedidos',
      modules: 'Módulos',
    };
    return labels[moduleName] ?? moduleName;
  }

  private readonly validModules = new Set([
    'users', 'product', 'category', 'provider', 'orders',
  ]);

  filterValidModules(modules: Set<string>): string[] {
    return [...modules].filter((m) => this.validModules.has(m));
  }

  /**
   * Ruta de gestión para cada módulo. El catálogo de compra (/product)
   * queda separado de la gestión (/admin/products).
   */
  getModuleRoute(moduleName: string): string {
    if (moduleName.toLowerCase() === 'product') {
      return '/admin/products';
    }
    return '/' + moduleName.toLowerCase();
  }
}
