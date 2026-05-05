import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../core/services/auth';

const MODULE_ICONS: Record<string, string> = {
  users: 'people',
  roles: 'admin_panel_settings',
  modules: 'widgets',
  product: 'inventory_2',
  category: 'category',
  provider: 'local_shipping',
  orders: 'receipt_long',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatCardModule, MatIconModule, TitleCasePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly authService = inject(AuthService);
  public readonly currentUser = this.authService.currentUser;
  public readonly userModules = this.authService.userModules;

  getIcon(moduleName: string): string {
    return MODULE_ICONS[moduleName.toLowerCase()] ?? 'extension';
  }
}
