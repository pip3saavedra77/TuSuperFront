import { inject, Injector } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

import { toObservable } from '@angular/core/rxjs-interop';
import { filter, first, map, of, switchMap, tap } from 'rxjs';

const isTenderoOrAdmin: CanMatchFn = () => {
  const authService = inject(AuthService);
  const injector = inject(Injector);
  const user$ = toObservable(authService.currentUser, { injector });

  return authService.checkAuthStatus().pipe(
    switchMap(isLoggedIn => {
      if (!isLoggedIn) return of(false);
      return user$.pipe(
        filter(user => !!user),
        first(),
        map(user =>
          !!user?.roles.some(r => {
            const roleName = r.name.toUpperCase();
            return roleName.includes('ADMIN') || 
                   roleName.includes('TENDERO');
          }),
        ),
      );
    }),
  );
};

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    canMatch: [isTenderoOrAdmin],
    loadComponent: () =>
      import('./product').then(m => m.Product),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/catalog/catalog.component').then(
        m => m.CatalogComponent,
      ),
  },
];
