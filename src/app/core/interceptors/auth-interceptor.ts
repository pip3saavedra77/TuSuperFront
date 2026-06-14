import { HttpInterceptorFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError, Observable } from 'rxjs';

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

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        cachedToken = data.access_token;
        localStorage.setItem('token', data.access_token);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

function getApiUrl(): string {
  // Leer de environment o usar fallback
  try {
    const env = (window as any).__env;
    return env?.apiUrl || 'https://tusuper-backend.onrender.com';
  } catch {
    return 'https://tusuper-backend.onrender.com';
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
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
        return from(tryRefresh()).pipe(
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
