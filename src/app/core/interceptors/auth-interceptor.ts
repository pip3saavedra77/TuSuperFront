import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

let isRedirecting = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const isCheckStatus = req.url.includes('/auth/check-status');
  const isLogout = req.url.includes('/auth/logout');

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({ withCredentials: true, setHeaders: headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isCheckStatus && !isLogout) {
        if (!isRedirecting) {
          isRedirecting = true;
          localStorage.removeItem('token');
          router.navigate(['/auth/log-in']).then(() => {
            isRedirecting = false;
          });
        }
      }
      return throwError(() => error);
    })
  );
};
