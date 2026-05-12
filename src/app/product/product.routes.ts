import { inject } from '@angular/core';
import { Routes, CanMatchFn } from '@angular/router';
import { AuthService } from '../core/services/auth';

const isTenderoOrAdmin: CanMatchFn = () => {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  return !!user?.roles.some(r =>
    ['ADMIN', 'TENDERO', 'VENDEDOR'].includes(r.name),
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
