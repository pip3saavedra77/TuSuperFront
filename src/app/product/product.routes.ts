import { inject } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

import { of } from 'rxjs';

const isTenderoOrAdmin: CanMatchFn = () => {
  const authService = inject(AuthService);
  return of(authService.isAdmin() || authService.isTendero());
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
