import { inject } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

const isAdminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  return !!user?.roles.some(r => r.name === 'ADMIN');
};

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    canMatch: [isAdminGuard],
    loadComponent: () => import('./components/orders-list/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: '',
    loadComponent: () => import('./components/my-orders/my-orders.component').then(m => m.MyOrdersComponent),
  }
];
