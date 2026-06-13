import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs';

let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 300_000; // 5 min

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && Date.now() - lastAuthCheck < AUTH_CACHE_TTL) {
    return true;
  }

  return authService.checkAuthStatus().pipe(
    map(isLoggedIn => {
      lastAuthCheck = Date.now();
      if (!isLoggedIn) {
        localStorage.removeItem('token');
        router.navigateByUrl('/auth/login');
        return false;
      }
      return true;
    })
  );
};