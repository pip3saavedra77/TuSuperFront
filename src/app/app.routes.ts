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
        path: 'users',
        loadComponent: () => import('./users/users').then(m => m.Users),
        canActivate: [roleGuard],
        data: { module: 'users' },
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles').then(m => m.Roles),
        canActivate: [roleGuard],
        data: { module: 'roles' },
      },
      {
        path: 'modules',
        loadComponent: () => import('./modules/modules').then(m => m.Modules),
        canActivate: [roleGuard],
        data: { module: 'modules' },
      },
      { path: '', redirectTo: 'users', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];