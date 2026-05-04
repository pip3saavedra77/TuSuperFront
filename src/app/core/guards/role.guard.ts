import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(Auth);
    const router = inject(Router);

    // Extraer el módulo requerido desde la configuración de la ruta
    const requiredModule = route.data['module'] as string;
    const userModules = authService.userModules();

    if (!requiredModule) return true; // Si la ruta no exige módulo, pasa.

    // Validación de acceso en tiempo O(1)
    if (userModules.includes(requiredModule)) {
        return true;
    }

    // Si no tiene el módulo, redirección forzada
    router.navigateByUrl('/dashboard');
    return false;
};