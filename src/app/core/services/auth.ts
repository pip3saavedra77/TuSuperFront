import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterPayload } from '../models/auth.models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { IdleService } from './idle.service';

const CACHE_TTL_MS = 60_000;
const TOKEN_REFRESH_MS = 25 * 60 * 1000;
const SLIDING_CHECK_MS = 15 * 60 * 1000;
const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly idleService = inject(IdleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly _authStatus = signal<AuthResponse | null>(null);
  private _lastCheckTime = 0;
  private _cachedCheck$: Observable<boolean> | null = null;
  private _tokenRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private _slidingCheckTimer: ReturnType<typeof setInterval> | null = null;
  private _expiryWarningId: ReturnType<typeof setTimeout> | null = null;
  private _lastRefreshTime = 0;

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

  /** Exposed for the interceptor — reads from dual storage */
  getToken(): string | null {
    return this.tokenService.get();
  }

  /** Exposed for the interceptor — clears both storages */
  clearToken(): void {
    this.tokenService.clear();
  }

  /**
   * Whether the token lives in localStorage (true) vs sessionStorage (false).
   * Used by the idle service to pick the right timeout.
   */
  isSessionPersistent(): boolean {
    return this.tokenService.isPersistent();
  }

  /* ── Login / Register ─────────────────────────────────── */

  public login(credentials: LoginCredentials, rememberMe = true): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => this._handleAuthResponse(response, rememberMe)),
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, payload).pipe(
      tap((response) => this._handleAuthResponse(response, true)),
    );
  }

  /* ── Logout ────────────────────────────────────────────── */

  public logout(): void {
    this._stopTimers();
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
      tap((response) => {
        this._authStatus.set(response);
        if (response.access_token) {
          this.tokenService.set(response.access_token, this.tokenService.isPersistent());
        }
        this._startTimers();
      }),
      map(() => true),
      catchError((err) => {
        if (err.status === 401) {
          this.clearSession();
        }
        return of(false);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this._cachedCheck$;
  }

  /* ── Proactive token refresh ──────────────────────────── */

  refreshToken(): Observable<boolean> {
    return this.http.post<{ access_token?: string }>(
      `${this.API_URL}/refresh`,
      {},
      { withCredentials: true },
    ).pipe(
      tap((res) => {
        if (res.access_token) {
          this.tokenService.set(res.access_token, this.tokenService.isPersistent());
        }
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  /* ── Internal helpers ──────────────────────────────────── */

  private _handleAuthResponse(response: AuthResponse, persistent: boolean): void {
    if (response.access_token) {
      this.tokenService.set(response.access_token, persistent);
    }
    this._authStatus.set(response);
    this._lastCheckTime = Date.now();
    this.sessionStartedAt.set(Date.now());
    this._scheduleExpiryWarning(response.access_token);
    this._startTimers();
  }

  private clearSession(): void {
    this._stopTimers();
    this.idleService.stopWatching();
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

  /** Inicia refresco proactivo + sliding check */
  private _startTimers(): void {
    this._stopTimers();

    this._tokenRefreshTimer = setInterval(() => {
      this.refreshToken().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }, TOKEN_REFRESH_MS);

    this._slidingCheckTimer = setInterval(() => {
      this.checkAuthStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }, SLIDING_CHECK_MS);
  }

  private _stopTimers(): void {
    if (this._tokenRefreshTimer !== null) {
      clearInterval(this._tokenRefreshTimer);
      this._tokenRefreshTimer = null;
    }
    if (this._slidingCheckTimer !== null) {
      clearInterval(this._slidingCheckTimer);
      this._slidingCheckTimer = null;
    }
    if (this._expiryWarningId !== null) {
      clearTimeout(this._expiryWarningId);
      this._expiryWarningId = null;
    }
  }

  /** Decodifica el payload del JWT y programa la advertencia de expiración */
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
      /* JWT malformed — skip warning */
    }
  }

  dismissExpirationWarning(): void {
    this.showExpirationWarning.set(false);
  }
}
