import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredModule = route.data['module'] as string;
  const userModules = authService.userModules();

  if (!requiredModule) return true;

  // Módulos exclusivos de gestión — usuarios normales no tienen acceso
  const managementOnlyModules = ['category', 'users', 'roles', 'modules', 'provider'];
  if (managementOnlyModules.includes(requiredModule) && !authService.hasManagementPrivileges()) {
    router.navigateByUrl('/home');
    return false;
  }

  if (userModules.has(requiredModule)) {
    return true;
  }

  router.navigateByUrl('/home');
  return false;
};