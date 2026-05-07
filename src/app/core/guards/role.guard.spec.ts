import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth';

class MockRouter {
  navigateByUrl = vi.fn();
}

class MockAuthService {
  private _userModules = new Set<string>();

  setModules(modules: string[]) {
    this._userModules = new Set(modules);
  }

  userModules = vi.fn(() => this._userModules);
}

describe('RoleGuard', () => {
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
  });

  it('debería permitir acceso si no se requiere un módulo específico', () => {
    route.data = {}; // No module required

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('debería permitir acceso si el usuario tiene el módulo requerido', () => {
    route.data = { module: 'admin' };
    mockAuthService.setModules(['admin', 'sales']);

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(true);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('debería redirigir a /forbidden si el usuario está autenticado pero no tiene el rol suficiente', () => {
    route.data = { module: 'admin' };
    mockAuthService.setModules(['sales']);

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(false);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/forbidden');
  });

  it('debería redirigir a /forbidden si el usuario no tiene roles asignados', () => {
    route.data = { module: 'admin' };
    mockAuthService.setModules([]); // Empty roles

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(false);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/forbidden');
  });
});
