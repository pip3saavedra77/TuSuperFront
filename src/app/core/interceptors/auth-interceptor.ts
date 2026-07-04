import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';

let isRefreshing = false;
let isRedirecting = false;

function isAccountDisabledError(error: HttpErrorResponse): boolean {
  const body = error.error;
  if (!body || typeof body !== 'object') return false;
  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  return typeof message === 'string' && message.toLowerCase().includes('deshabilitada');
}

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

  // Use localStorage token only; no cookie dependency
  const authReq = req.clone({ setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isLogout) {
        if (isAccountDisabledError(error)) {
          if (!isRedirecting) {
            isRedirecting = true;
            auth.clearToken();
            router.navigate(['/auth/account-disabled']).then(() => { isRedirecting = false; });
          }
          return throwError(() => error);
        }
        if (!isCheckStatus && !isRefresh) {
          return from(tryRefresh(http, auth)).pipe(
            switchMap((ok) => {
              if (ok) {
                const newToken = auth.getToken();
                const retryHeaders: Record<string, string> = {};
                if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
                return next(req.clone({ setHeaders: retryHeaders }));
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
