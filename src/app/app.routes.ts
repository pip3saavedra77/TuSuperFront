import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './core/components/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.Home),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users').then(m => m.Users),
        canActivate: [roleGuard],
        data: { module: 'users' },
      },
      {
        path: 'modules',
        loadComponent: () => import('./modules/modules').then(m => m.Modules),
        canActivate: [roleGuard],
        data: { module: 'modules' },
      },
      {
        path: 'product',
        loadChildren: () =>
          import('./product/product.routes').then(m => m.PRODUCT_ROUTES),
        canActivate: [roleGuard],
        data: { module: 'product' },
      },
      {
        path: 'category',
        loadComponent: () => import('./category/category').then(m => m.CategoryComponent),
        canActivate: [roleGuard],
        data: { module: 'category' },
      },
      {
        path: 'provider',
        loadComponent: () => import('./provider/provider').then(m => m.ProviderComponent),
        canActivate: [roleGuard],
        data: { module: 'provider' },
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders.routes').then(m => m.ORDERS_ROUTES),
        canActivate: [roleGuard],
        data: { module: 'orders' },
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];