import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

    return authService.checkAuthStatus().pipe(
      map(isLoggedIn => {
        if (!isLoggedIn) {
          localStorage.removeItem('token');
          router.navigateByUrl('/auth/login');
          return false;
        }
        return true;
      })
    );
};