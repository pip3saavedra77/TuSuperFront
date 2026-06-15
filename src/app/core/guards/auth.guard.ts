import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';

let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 300_000;

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
        router.navigateByUrl('/auth/login');
        return false;
      }
      return true;
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        localStorage.removeItem('token');
        router.navigateByUrl('/auth/login');
        return of(false);
      }
      // Error de red / timeout — permitir paso, la sesión puede ser válida aún
      return of(true);
    }),
  );
};
