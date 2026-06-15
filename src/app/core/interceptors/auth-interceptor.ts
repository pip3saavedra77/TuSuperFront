import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
let isRedirecting = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const isCheckStatus = req.url.includes('/auth/check-status');
  const isLogout = req.url.includes('/auth/logout');
  const isRefresh = req.url.includes('/auth/refresh');

  const token = auth.getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({ withCredentials: true, setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isCheckStatus && !isLogout && !isRefresh) {
        return from(tryRefresh(http, auth)).pipe(
          switchMap((ok) => {
            if (ok) {
              const newToken = auth.getToken();
              const retryHeaders: Record<string, string> = {};
              if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
              return next(req.clone({ withCredentials: true, setHeaders: retryHeaders }));
            }
            if (!isRedirecting) {
              isRedirecting = true;
              auth.clearToken();
              router.navigate(['/auth/log-in']).then(() => { isRedirecting = false; });
            }
            return throwError(() => error);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};

async function tryRefresh(http: HttpClient, auth: AuthService): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const ok = await firstValueFrom(auth.refreshToken());
    return ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}
