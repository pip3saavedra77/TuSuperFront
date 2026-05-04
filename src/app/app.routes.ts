import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './core/components/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard'; // [NUEVA DEPENDENCIA INYECTADA]

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: '',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            // Mantengo el dashboard comentado hasta que Claude te genere los archivos base
            // {
            //     path: 'dashboard',
            //     loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
            // },
            {
                path: 'users',
                loadComponent: () => import('./users/users').then(m => m.Users),
                canActivate: [roleGuard],         // Bloqueo de acceso
                data: { module: 'users' }         // Módulo exigido en la base de datos
            },
            {
                path: 'roles',
                loadComponent: () => import('./roles/roles').then(m => m.Roles),
                canActivate: [roleGuard],
                data: { module: 'roles' }
            },
            {
                path: 'modules',
                loadComponent: () => import('./modules/modules').then(m => m.Modules),
                canActivate: [roleGuard],
                data: { module: 'modules' }
            },
            { path: '', redirectTo: 'users', pathMatch: 'full' }
        ]
    },
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full'
    },
    {
        path: '**', // Sumidero de seguridad: atrapa cualquier URL inventada o no autorizada
        redirectTo: 'auth'
    }
];