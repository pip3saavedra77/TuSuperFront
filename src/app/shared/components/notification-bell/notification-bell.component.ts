import { Component, inject, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OverlayModule } from '@angular/cdk/overlay';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AuthService } from '../../../core/services/auth';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    OverlayModule,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class NotificationBellComponent {
  public readonly notificationsService = inject(NotificationsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly notifications = this.notificationsService.allNotifications;
  public readonly unreadCount = this.notificationsService.unreadCount;

  public isOpen = false;

  public readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];

  /**
   * Determina el tipo de perfil para aplicar estilos dinámicos.
   */
  public readonly profileType = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'admin';
    const roleNames = user.roles.map(r => r.name.toUpperCase());
    if (roleNames.some(name => name.includes('ADMIN'))) return 'admin';
    if (roleNames.some(name => name.includes('TENDERO'))) return 'seller';
    return 'buyer';
  });

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  closePanel(): void {
    this.isOpen = false;
  }

  navigateToOrder(notification: Notification): void {
    this.notificationsService.markAsRead(notification.id);
    this.closePanel();
    const role = this.profileType();
    if (role === 'admin' || role === 'seller') {
      this.router.navigate(['/orders']);
    } else {
      this.router.navigate(['/orders/my-orders']);
    }
  }

  markAsRead(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.notificationsService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  clearAll(): void {
    this.notificationsService.clearAll();
  }

  getTimeAgo(date: string): string {
    return this.notificationsService.getTimeAgo(date);
  }
}
