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
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
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
  ],
})
export class AdminLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsService = inject(NotificationsService);
  readonly cartStore = inject(CartStore);

  public isAuthenticated = this.authService.isAuthenticated;
  public menuItems = this.authService.userModules;
  public currentUser = this.authService.currentUser;

  constructor() {
    this.notificationsService.connect();
  }

  public profileClass = computed(() => {
    const roles = this.currentUser()?.roles;
    if (!roles || roles.length === 0) return 'profile-admin';
    
    const roleNames = roles.map(r => r.name.toUpperCase());
    
    if (roleNames.some(name => name.includes('ADMIN'))) return 'profile-admin';
    if (roleNames.some(name => name.includes('TENDER') || name.includes('VENDEDOR'))) return 'profile-tendero';
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
    this.authService.logout();
  }

  onCartClick(): void {
    this.router.navigateByUrl('/product').then(() => {
      this.cartStore.openCart();
    });
  }
}
