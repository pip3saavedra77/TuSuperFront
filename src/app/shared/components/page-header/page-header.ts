import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, NotificationBellComponent],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  private readonly router = inject(Router);

  onSearchClick(): void {
    this.router.navigateByUrl('/product');
  }
}
