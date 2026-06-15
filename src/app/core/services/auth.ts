import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterPayload } from '../models/auth.models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const CACHE_TTL_MS = 10_000;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly _authStatus = signal<AuthResponse | null>(null);
  private _lastCheckTime = 0;
  private _cachedCheck$: Observable<boolean> | null = null;

  public currentUser = computed(() => this._authStatus()?.user);
  public isAuthenticated = computed(() => !!this._authStatus());
  public hasManagementPrivileges = computed(() => {
    const roles = this._authStatus()?.user.roles;
    if (!roles) return false;
    return roles.some(r => {
      const name = r.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('TENDERO');
    });
  });

  public userModules = computed(() => {
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

  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
        this._authStatus.set(response);
        this._lastCheckTime = Date.now();
      })
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, payload).pipe(
      tap((response) => {
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
        this._authStatus.set(response);
        this._lastCheckTime = Date.now();
      })
    );
  }

  public logout(): void {
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('remember_email');
    this._authStatus.set(null);
    this._cachedCheck$ = null;
    this._lastCheckTime = 0;
    this.router.navigateByUrl('/auth');
  }

  public forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  public validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.API_URL}/validate-reset-token`, { token });
  }

  public resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, { token, newPassword });
  }

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
          localStorage.setItem('token', response.access_token);
        }
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
}
