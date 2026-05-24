import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent {
  public readonly notificationsService = inject(NotificationsService);
  private readonly authService = inject(AuthService);

  public readonly notifications = this.notificationsService.allNotifications;
  public readonly unreadCount = this.notificationsService.unreadCount;

  /**
   * Determina el tipo de perfil para aplicar estilos dinámicos.
   */
  public readonly profileType = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'admin';
    
    const roleNames = user.roles.map(r => r.name.toUpperCase());
    if (roleNames.some(name => name.includes('ADMIN'))) return 'admin';
    if (roleNames.some(name => name.includes('TENDER') || name.includes('VENDEDOR'))) return 'seller';
    return 'buyer';
  });

  /**
   * Marca una notificación como leída sin cerrar el menú.
   */
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
