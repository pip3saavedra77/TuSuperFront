import { inject } from '@angular/core';
import { Routes, CanActivateFn } from '@angular/router';
import { AuthService } from '../core/services/auth';
import { Router } from '@angular/router';

import { of } from 'rxjs';

const isAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAdmin() || authService.isTendero()) return true;
  router.navigateByUrl('/home');
  return false;
};

const isUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isUser()) return true;
  router.navigateByUrl('/home');
  return false;
};

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [isAdminGuard],
    loadComponent: () => import('./components/orders-list/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: 'checkout',
    canActivate: [isUserGuard],
    loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'my-orders',
    canActivate: [isUserGuard],
    loadComponent: () => import('./components/my-orders/my-orders.component').then(m => m.MyOrdersComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'my-orders'
  }
];
