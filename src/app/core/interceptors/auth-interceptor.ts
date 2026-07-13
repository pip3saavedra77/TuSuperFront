import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { DpopService } from '../services/dpop.service';

let isRefreshing = false;
let isRedirecting = false;

export function resetAuthState(): void {
  isRefreshing = false;
  isRedirecting = false;
}

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
  const dpop = inject(DpopService);
  const isCheckStatus = req.url.includes('/auth/check-status');
  const isLogout = req.url.includes('/auth/logout');
  const isRefresh = req.url.includes('/auth/refresh');
  const isDpopReady = dpop.isReady();

  const token = auth.getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let authReq = req.clone({ setHeaders: headers, withCredentials: true });

  if (isDpopReady && token && !isLogout && !isRefresh) {
    const proofPromise = dpop.signProof(req.method, req.url, token);
    if (proofPromise) {
      return from(proofPromise).pipe(
        switchMap((proof) => {
          if (proof) {
            authReq = req.clone({
              setHeaders: { ...headers, 'DPoP': proof },
              withCredentials: true,
            });
          }
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
                        return next(req.clone({ setHeaders: retryHeaders, withCredentials: true }));
                      }
                      if (!isRedirecting) {
                        isRedirecting = true;
                        auth.clearToken();
                        router.navigate(['/auth/login']).then(() => { isRedirecting = false; });
                      }
                      return throwError(() => error);
                    }),
                  );
                }
              }
              return throwError(() => error);
            }),
          );
        }),
      );
    }
  }

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
                return next(req.clone({ setHeaders: retryHeaders, withCredentials: true }));
              }
              if (!isRedirecting) {
                isRedirecting = true;
                auth.clearToken();
                router.navigate(['/auth/login']).then(() => { isRedirecting = false; });
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
