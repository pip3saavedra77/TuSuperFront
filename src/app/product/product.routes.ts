import { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/catalog/catalog.component').then(
        m => m.CatalogComponent,
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./components/cart-page/cart-page.component').then(
        m => m.CartPageComponent,
      ),
  },
];
