import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { catchError, map, of, switchMap } from 'rxjs';

let lastAuthCheck = 0;
const AUTH_CACHE_TTL = 300_000;

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && Date.now() - lastAuthCheck < AUTH_CACHE_TTL) {
    return true;
  }

  return authService.checkAuthStatus().pipe(
    switchMap(isLoggedIn => {
      if (isLoggedIn) {
        lastAuthCheck = Date.now();
        return of(true);
      }
      return authService.refreshToken().pipe(
        switchMap(refreshed => {
          if (refreshed) {
            return authService.checkAuthStatus().pipe(
              map(retryOk => {
                lastAuthCheck = Date.now();
                return retryOk;
              }),
            );
          }
          router.navigateByUrl('/auth/login');
          return of(false);
        }),
        catchError(() => {
          router.navigateByUrl('/auth/login');
          return of(false);
        }),
      );
    }),
    catchError(() => {
      return authService.refreshToken().pipe(
        switchMap(ok => {
          if (ok) {
            return authService.checkAuthStatus().pipe(
              map(r => { lastAuthCheck = Date.now(); return r; }),
            );
          }
          router.navigateByUrl('/auth/login');
          return of(false);
        }),
        catchError(() => {
          router.navigateByUrl('/auth/login');
          return of(false);
        }),
      );
    }),
  );
};
