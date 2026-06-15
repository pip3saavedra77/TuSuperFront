import { inject } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

import { of } from 'rxjs';

const isAdminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return of(authService.isAdmin() || authService.isTendero());
};

const isUserGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  return of(authService.isUser());
};

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    canMatch: [isAdminGuard],
    loadComponent: () => import('./components/orders-list/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: 'checkout',
    canMatch: [isUserGuard],
    loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'my-orders',
    canMatch: [isUserGuard],
    loadComponent: () => import('./components/my-orders/my-orders.component').then(m => m.MyOrdersComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'my-orders'
  }
];
