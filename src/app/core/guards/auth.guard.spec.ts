import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, firstValueFrom, Observable } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth';

class MockRouter {
  navigateByUrl = vi.fn();
}

class MockAuthService {
  private _isAuthenticated = true;

  setAuthenticated(val: boolean) {
    this._isAuthenticated = val;
  }

  isAuthenticated = vi.fn(() => this._isAuthenticated);
  checkAuthStatus = vi.fn(() => of(this._isAuthenticated));
}

describe('AuthGuard', () => {
  let mockRouter: MockRouter;
  let mockAuthService: MockAuthService;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;
  let injector: Injector;

  beforeEach(() => {
    mockRouter = new MockRouter();
    mockAuthService = new MockAuthService();

    injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    route = new ActivatedRouteSnapshot();
    state = { url: '/test', root: route } as RouterStateSnapshot;
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debería permitir acceso si el usuario está autenticado', async () => {
    mockAuthService.setAuthenticated(true);
    mockAuthService.checkAuthStatus.mockReturnValue(of(true));

    const result = runInInjectionContext(injector, () => authGuard(route, state));
    const value = typeof result === 'boolean'
      ? result
      : await firstValueFrom(result as Observable<boolean>);

    expect(value).toBe(true);
    expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('debería redirigir a /auth/login y limpiar storage si checkAuthStatus retorna false', async () => {
    mockAuthService.setAuthenticated(false);
    localStorage.setItem('token', 'expired-token');

    const result = runInInjectionContext(injector, () => authGuard(route, state));

    const value = typeof result === 'boolean' 
      ? result 
      : await firstValueFrom(result as Observable<boolean>);

    expect(value).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('debería permitir acceso si el usuario no parece autenticado pero checkAuthStatus retorna true', async () => {
    mockAuthService.setAuthenticated(false);
    mockAuthService.checkAuthStatus.mockReturnValue(of(true));

    const result = runInInjectionContext(injector, () => authGuard(route, state));

    const value = typeof result === 'boolean' 
      ? result 
      : await firstValueFrom(result as Observable<boolean>);

    expect(value).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });
});
