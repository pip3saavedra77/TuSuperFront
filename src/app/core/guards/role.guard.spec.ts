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
  private _hasManagement = false;

  setModules(modules: string[]) {
    this._userModules = new Set(modules);
  }

  setManagement(val: boolean) {
    this._hasManagement = val;
  }

  userModules = vi.fn(() => this._userModules);
  hasManagementPrivileges = vi.fn(() => this._hasManagement);
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

  it('debería redirigir a /home si no se requiere un módulo específico', () => {
    route.data = {};

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(false);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('debería permitir acceso si el usuario tiene el módulo requerido', () => {
    route.data = { module: 'orders' };
    mockAuthService.setModules(['orders', 'product']);

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(true);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('debería redirigir a /home si el usuario no tiene el módulo', () => {
    route.data = { module: 'admin' };
    mockAuthService.setModules(['orders']);

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(false);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home');
  });

  it('debería redirigir a /home si el usuario no tiene módulos asignados', () => {
    route.data = { module: 'admin' };
    mockAuthService.setModules([]);

    const result = runInInjectionContext(injector, () => roleGuard(route, state));

    expect(result).toBe(false);
    expect(mockAuthService.userModules).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home');
  });
});
