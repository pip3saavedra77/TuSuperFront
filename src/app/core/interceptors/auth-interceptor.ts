import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError, firstValueFrom } from 'rxjs';

let isRefreshing = false;
let isRedirecting = false;
let cachedToken: string | null = null;

function getToken(): string | null {
  if (cachedToken !== null) return cachedToken || null;
  cachedToken = localStorage.getItem('token');
  return cachedToken;
}

function clearToken(): void {
  cachedToken = null;
  localStorage.removeItem('token');
}

export function resetTokenCache(): void {
  cachedToken = null;
}

function getApiUrl(): string {
  try {
    const env = (window as any).__env;
    return env?.apiUrl || 'https://tusuper-backend.onrender.com';
  } catch {
    return 'https://tusuper-backend.onrender.com';
  }
}

async function tryRefresh(http: HttpClient): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const data = await firstValueFrom(
      http.post<{ access_token: string }>(
        `${getApiUrl()}/auth/refresh`,
        {},
        { withCredentials: true },
      ),
    );
    if (data.access_token) {
      cachedToken = data.access_token;
      localStorage.setItem('token', data.access_token);
    }
    return true;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const isCheckStatus = req.url.includes('/auth/check-status');
  const isLogout = req.url.includes('/auth/logout');
  const isRefresh = req.url.includes('/auth/refresh');

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({ withCredentials: true, setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isCheckStatus && !isLogout && !isRefresh) {
        return from(tryRefresh(http)).pipe(
          switchMap((ok) => {
            if (ok) {
              const newToken = getToken();
              const retryHeaders: Record<string, string> = {};
              if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
              return next(req.clone({ withCredentials: true, setHeaders: retryHeaders }));
            }
            if (!isRedirecting) {
              isRedirecting = true;
              clearToken();
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
