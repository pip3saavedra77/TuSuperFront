import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { catchError, map, of, switchMap } from 'rxjs';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Trust in-memory state after APP_INITIALIZER populated it.
  // Only hit the backend if auth was verified more than 5 min ago.
  if (authService.isAuthenticated() && authService.isAuthFresh()) {
    return true;
  }

  return authService.checkAuthStatus().pipe(
    switchMap(isLoggedIn => {
      if (isLoggedIn) {
        return of(true);
      }
      return authService.refreshToken().pipe(
        switchMap(refreshed => {
          if (refreshed) {
            return authService.checkAuthStatus().pipe(
              map(retryOk => retryOk),
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
            return authService.checkAuthStatus();
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
