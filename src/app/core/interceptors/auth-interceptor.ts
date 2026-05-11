import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';

let isRedirecting = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const isCheckStatus = req.url.includes('/auth/check-status');

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
  }

  return next(authReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && isCheckStatus) {
        const body = event.body as { token?: string } | null;
        if (body?.token) {
          localStorage.setItem('token', body.token);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isCheckStatus) {
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
