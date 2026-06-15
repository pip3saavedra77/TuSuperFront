import { Routes } from '@angular/router';

export const PRODUCT_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./product').then(m => m.Product),
  },
];
