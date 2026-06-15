import { Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [UserDashboardComponent, AdminDashboardComponent],
  template: `
    @if (auth.isUser()) {
      <app-user-dashboard />
    } @else {
      <app-admin-dashboard />
    }
  `,
})
export class Home {
  readonly auth = inject(AuthService);
}
