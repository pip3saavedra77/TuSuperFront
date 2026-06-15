import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';

import { authInterceptor, resetTokenCache } from './auth-interceptor';

function runInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  return TestBed.runInInjectionContext(() => authInterceptor(req, next));
}

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = authInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    resetTokenCache();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-token-123');
    const req = new HttpRequest('GET', '/api/data');
    const next: HttpHandlerFn = (r) => {
      expect(r.headers.get('Authorization')).toBe('Bearer test-token-123');
      return of({} as any);
    };

    await firstValueFrom(runInterceptor(req, next));
  });

  it('should not add Authorization header when no token', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const next: HttpHandlerFn = (r) => {
      expect(r.headers.get('Authorization')).toBeNull();
      return of({} as any);
    };

    await firstValueFrom(runInterceptor(req, next));
  });

  it('should add withCredentials to all requests', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const next: HttpHandlerFn = (r) => {
      expect(r.withCredentials).toBe(true);
      return of({} as any);
    };

    await firstValueFrom(runInterceptor(req, next));
  });

  it('should not intercept 401 on check-status requests', async () => {
    localStorage.setItem('token', 'test-token');
    const req = new HttpRequest('GET', '/api/auth/check-status');
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    try {
      await firstValueFrom(runInterceptor(req, next));
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('should not intercept 401 on refresh requests', async () => {
    localStorage.setItem('token', 'test-token');
    const req = new HttpRequest('POST', '/api/auth/refresh', {});
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = () => throwError(() => error);

    try {
      await firstValueFrom(runInterceptor(req, next));
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('should not intercept non-401 errors', async () => {
    localStorage.setItem('token', 'test-token');
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 500 });
    const next: HttpHandlerFn = () => throwError(() => error);

    try {
      await firstValueFrom(runInterceptor(req, next));
    } catch (err: any) {
      expect(err.status).toBe(500);
    }
  });
});
