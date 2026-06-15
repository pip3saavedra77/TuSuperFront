import { Component, inject, computed, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationsService } from '../../services/notifications.service';
import { IdleService } from '../../services/idle.service';
import { PushService } from '../../services/push.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { PushPromptComponent } from '../../../shared/components/push-prompt/push-prompt.component';
import { CartStore } from '../../../product/store/cart.store';

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
    MatBadgeModule,
    AsyncPipe,
    NotificationBellComponent,
    PushPromptComponent,
  ],
})
export class AdminLayoutComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  private readonly idleService = inject(IdleService);
  private readonly pushService = inject(PushService);
  readonly cartStore = inject(CartStore);

  public isAuthenticated = this.authService.isAuthenticated;
  public menuItems = this.authService.userModules;
  public currentUser = this.authService.currentUser;

  constructor() {}

  ngOnInit(): void {
    this.notificationsService.connect();
    this.idleService.startWatching();
    this.pushService.subscribe().then(r => { if (!r.ok) console.warn('Push subscribe:', r.error); }).catch(() => {});
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

  logout(): void {
    this.notificationsService.disconnect();
    this.idleService.stopWatching();
    this.authService.logout();
  }

  onCartClick(): void {
    this.router.navigateByUrl('/product').then(() => {
      this.cartStore.openCart();
    });
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
}
