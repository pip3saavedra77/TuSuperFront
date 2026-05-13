import { inject, Injector } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

import { toObservable } from '@angular/core/rxjs-interop';
import { filter, first, map, of, switchMap, tap } from 'rxjs';

const isAdminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const injector = inject(Injector);
  const user$ = toObservable(authService.currentUser, { injector });

  return authService.checkAuthStatus().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) return of(false);
      return user$.pipe(
        filter(user => !!user),
        first(),
        map(user => !!user?.roles.some(r => r.name === 'ADMIN')),
      );
    }),
  );
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
