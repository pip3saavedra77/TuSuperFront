import { Component, inject, computed } from '@angular/core';
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
export class AdminLayoutComponent {
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

  constructor() {
    this.notificationsService.connect();
    this.idleService.startWatching();
    this.pushService.subscribe().then(r => { if (!r.ok) console.warn('Push subscribe:', r.error); }).catch(() => {});
  }

  public profileClass = computed(() => {
    const roles = this.currentUser()?.roles;
    if (!roles || roles.length === 0) return 'profile-admin';
    
    const roleNames = roles.map(r => r.name.toUpperCase());
    
    if (roleNames.some(name => name.includes('ADMIN'))) return 'profile-admin';
    if (roleNames.some(name => name.includes('TENDERO'))) return 'profile-tendero';
    if (roleNames.some(name => name.includes('USER') || name.includes('COMPRADOR'))) return 'profile-usuario';
    
    return 'profile-admin';
  });

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public isUserRole = computed(() =>
    this.profileClass() === 'profile-usuario',
  );

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
      roles: 'Roles',
      product: 'Productos',
      category: 'Categorías',
      provider: 'Proveedores',
      orders: 'Pedidos',
      modules: 'Módulos',
    };
    return labels[moduleName] ?? moduleName;
  }

  private readonly validModules = new Set([
    'users', 'roles', 'product', 'category', 'provider', 'orders', 'modules',
  ]);

  filterValidModules(modules: Set<string>): string[] {
    return [...modules].filter((m) => this.validModules.has(m));
  }
}
