import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredModule = route.data['module'] as string;
  const userModules = authService.userModules();

  if (!requiredModule) return true;

  if (userModules.has(requiredModule)) {
    return true;
  }

  router.navigateByUrl('/auth');
  return false;
};