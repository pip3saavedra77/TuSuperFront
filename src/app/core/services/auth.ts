import { Injectable, inject, Injector, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, tap, timeout } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterPayload } from '../models/auth.models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { DpopService } from './dpop.service';
import { IdleService } from './idle.service';
import { InitService } from './init.service';
import { PushService } from './push.service';

const CACHE_TTL_MS = 60_000;
const TOKEN_REFRESH_MS = 25 * 60 * 1000;
const SLIDING_CHECK_MS = 15 * 60 * 1000;
const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly dpopService = inject(DpopService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly initService = inject(InitService);
  private readonly pushService = inject(PushService);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  /** Lazy HttpClient para evitar NG0200 con authInterceptor */
  private get http(): HttpClient {
    return this.injector.get(HttpClient);
  }

  private readonly _authStatus = signal<AuthResponse | null>(null);
  private _lastCheckTime = 0;
  private _cachedCheck$: Observable<boolean> | null = null;
  private _tokenRefreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private _slidingCheckTimerId: ReturnType<typeof setTimeout> | null = null;
  private _expiryWarningId: ReturnType<typeof setTimeout> | null = null;
  private _ticking = false;

  public readonly currentUser = computed(() => this._authStatus()?.user);
  public readonly isAuthenticated = computed(() => !!this._authStatus());

  public readonly showExpirationWarning = signal(false);
  public readonly sessionStartedAt = signal<number | null>(null);
  public readonly sessionExpiresAt = signal<number | null>(null);

  public readonly hasManagementPrivileges = computed(() => {
    const roles = this._authStatus()?.user.roles;
    if (!roles) return false;
    return roles.some(r => {
      const name = r.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('TENDERO');
    });
  });

  public readonly userModules = computed(() => {
    const user = this._authStatus()?.user;
    if (!user) return new Set<string>();
    return new Set(user.roles.flatMap(r => r.modules.map(m => m.name)));
  });

  public readonly isUser = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'USER') ?? false
  );

  public readonly isAdmin = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'ADMIN') ?? false
  );

  public readonly isTendero = computed(() =>
    this.currentUser()?.roles.some(r => r.name.toUpperCase() === 'TENDERO') ?? false
  );

  getToken(): string | null { return this.tokenService.get(); }
  clearToken(): void { this.tokenService.clear(); }
  isSessionPersistent(): boolean { return this.tokenService.isPersistent(); }

  /** Returns true if auth was verified recently (avoids redundant HTTP calls in guards). */
  isAuthFresh(): boolean {
    return !!this._authStatus() && (Date.now() - this._lastCheckTime) < CACHE_TTL_MS;
  }

  /* ── Login / Register ─────────────────────────────────── */

  public login(credentials: LoginCredentials, rememberMe = true): Observable<AuthResponse> {
    let headers = new HttpHeaders();
    const dpopJwk = this.dpopService.getPublicJwkBase64();
    if (dpopJwk) {
      headers = headers.set('x-dpop-jwk', dpopJwk);
    }
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials, { headers }).pipe(
      tap((response) => this._handleAuthResponse(response, rememberMe)),
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    let headers = new HttpHeaders();
    const dpopJwk = this.dpopService.getPublicJwkBase64();
    if (dpopJwk) {
      headers = headers.set('x-dpop-jwk', dpopJwk);
    }
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, payload, { headers }).pipe(
      tap((response) => this._handleAuthResponse(response, true)),
    );
  }

  /* ── Logout ────────────────────────────────────────────── */

  public logout(): void {
    this._stopTimers();
    this.pushService.unsubscribe();
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  /* ── Password flows ────────────────────────────────────── */

  public forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  public validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.API_URL}/validate-reset-token`, { token });
  }

  public resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, { token, newPassword });
  }

  /* ── Auth status ───────────────────────────────────────── */

  public checkAuthStatus(): Observable<boolean> {
    const now = Date.now();
    if (this._cachedCheck$ && (now - this._lastCheckTime) < CACHE_TTL_MS) {
      return this._cachedCheck$;
    }

    this._lastCheckTime = now;
    this._cachedCheck$ = this.http.get<AuthResponse>(`${this.API_URL}/check-status`).pipe(
      timeout(5000),
      tap((response) => {
        this._authStatus.set(response);
        if (response.access_token) {
          this.tokenService.set(response.access_token, this.tokenService.isPersistent());
        }
        if (response.refresh_token) {
          this.tokenService.setRefreshToken(response.refresh_token);
        }
        this._startTimers();
      }),
      map(() => true),
      catchError(() => of(false)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this._cachedCheck$;
  }

  /* ── Lazy IdleService ─────────────────────────────────── */

  /** Resuelve IdleService perezosamente para evitar NG0200 circular */
  private _getIdleService() {
    return this.injector.get(IdleService);
  }

  /* ── Proactive token refresh ──────────────────────────── */

  refreshToken(): Observable<boolean> {
    return this.http.post<{ access_token?: string; refresh_token?: string }>(
      `${this.API_URL}/refresh`,
      {},
    ).pipe(
      timeout(5000),
      tap((res) => {
        if (res.access_token) {
          this.tokenService.set(res.access_token, this.tokenService.isPersistent());
        }
        if (res.refresh_token) {
          this.tokenService.setRefreshToken(res.refresh_token);
        }
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.clearSession();
        }
        return of(false);
      }),
    );
  }

  /* ── Internal helpers ──────────────────────────────────── */

  private _handleAuthResponse(response: AuthResponse, persistent: boolean): void {
    if (response.access_token) {
      this.tokenService.set(response.access_token, persistent);
    }
    if (response.refresh_token) {
      this.tokenService.setRefreshToken(response.refresh_token);
    }
    this._authStatus.set(response);
    this._lastCheckTime = Date.now();
    this.sessionStartedAt.set(Date.now());
    this._scheduleExpiryWarning(response.access_token);
    this._startTimers();
  }

  private clearSession(): void {
    this._stopTimers();
    this._getIdleService().stopWatching();
    this.tokenService.clear();
    localStorage.removeItem('remember_email');
    this._authStatus.set(null);
    this._cachedCheck$ = null;
    this._lastCheckTime = 0;
    this.showExpirationWarning.set(false);
    this.sessionExpiresAt.set(null);
    this.sessionStartedAt.set(null);
    this.router.navigateByUrl('/auth');
  }

  /* ── Timer management (background-safe) ────────────────── */

  private _startTimers(): void {
    this._stopTimers();
    this._ticking = true;
    document.addEventListener('visibilitychange', this._onVisibility);
    this._scheduleRefresh();
    this._scheduleSliding();
  }

  private _stopTimers(): void {
    this._ticking = false;
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._tokenRefreshTimerId !== null) {
      clearTimeout(this._tokenRefreshTimerId);
      this._tokenRefreshTimerId = null;
    }
    if (this._slidingCheckTimerId !== null) {
      clearTimeout(this._slidingCheckTimerId);
      this._slidingCheckTimerId = null;
    }
    if (this._expiryWarningId !== null) {
      clearTimeout(this._expiryWarningId);
      this._expiryWarningId = null;
    }
  }

  private readonly _onVisibility = () => {
    if (document.hidden) {
      // Pausa implícita — los setTimeout simplemente no se ejecutan hasta volver
    } else {
      // Al volver al frente, reprogramar timers y hacer refresh solo si el token expira pronto
      if (this._ticking) {
        this._scheduleRefresh();
        this._scheduleSliding();
        if (this._isTokenExpiringSoon()) {
          this.refreshToken().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      }
    }
  };

  private _isTokenExpiringSoon(): boolean {
    const expiresAt = this.sessionExpiresAt();
    if (!expiresAt) return false;
    return expiresAt - Date.now() < 5 * 60 * 1000; // < 5 min
  }

  private _scheduleRefresh(): void {
    if (!this._ticking) return;
    if (this._tokenRefreshTimerId !== null) clearTimeout(this._tokenRefreshTimerId);
    this._tokenRefreshTimerId = setTimeout(() => {
      if (!this._ticking) return;
      if (document.hidden) {
        this._scheduleRefresh();
        return;
      }
      this.refreshToken().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      this._scheduleRefresh();
    }, TOKEN_REFRESH_MS);
  }

  private _scheduleSliding(): void {
    if (!this._ticking) return;
    if (this._slidingCheckTimerId !== null) clearTimeout(this._slidingCheckTimerId);
    this._slidingCheckTimerId = setTimeout(() => {
      if (!this._ticking) return;
      if (document.hidden) {
        this._scheduleSliding();
        return;
      }
      this.checkAuthStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((ok) => {
        if (!ok) {
          this.refreshToken().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      });
      this._scheduleSliding();
    }, SLIDING_CHECK_MS);
  }

  /* ── Expiry warning ──────────────────────────────────── */

  private _scheduleExpiryWarning(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp as number;
      if (!exp) return;

      const expiresAt = exp * 1000;
      this.sessionExpiresAt.set(expiresAt);
      const delay = expiresAt - Date.now() - WARNING_BEFORE_EXPIRY_MS;

      if (delay > 0) {
        this._expiryWarningId = setTimeout(() => {
          this.showExpirationWarning.set(true);
        }, delay);
      }
    } catch {
      /* skip */
    }
  }

  dismissExpirationWarning(): void {
    this.showExpirationWarning.set(false);
  }

  /** Initialize auth on app bootstrap - used by APP_INITIALIZER (non-blocking) */
  initializeAuth(): void {
    this.dpopService.init().then(() => {
      this.checkAuthStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.initService.complete();
        },
        error: () => {
          this.refreshToken().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              this.initService.complete();
            },
            error: () => {
              this.initService.complete();
            },
          });
        },
      });
    });
  }
}
