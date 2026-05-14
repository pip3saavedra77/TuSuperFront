import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, shareReplay } from 'rxjs';
import { AuthResponse, LoginCredentials, RegisterPayload } from '../models/auth.models';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly _authStatus = signal<AuthResponse | null>(null);

  public currentUser = computed(() => this._authStatus()?.user);
  public isAuthenticated = computed(() => !!this._authStatus());
  public hasManagementPrivileges = computed(() => {
    const roles = this._authStatus()?.user.roles;
    if (!roles) return false;
    return roles.some(r => {
      const name = r.name.toUpperCase();
      return name.includes('ADMIN') || name.includes('TENDER') || name.includes('VENDEDOR');
    });
  });

  public userModules = computed(() => {
    const user = this._authStatus()?.user;
    if (!user) return new Set<string>();
    return new Set(user.roles.flatMap(r => r.modules.map(m => m.name)));
  });

  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    localStorage.removeItem('token');

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        localStorage.setItem('token', response.access_token);
        this._authStatus.set(response);
      })
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    localStorage.removeItem('token');

    return this.http.post<AuthResponse>(`${this.API_URL}/register`, payload).pipe(
      tap((response) => {
        localStorage.setItem('token', response.access_token);
        this._authStatus.set(response);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('token');
    this._authStatus.set(null);
    this._checkStatus$ = undefined;
    this.router.navigateByUrl('/auth');
  }

  private _checkStatus$?: Observable<boolean>;
  public checkAuthStatus(): Observable<boolean> {
    if (this._checkStatus$) return this._checkStatus$;

    const token = localStorage.getItem('token');
    if (!token) return of(false);

    this._checkStatus$ = this.http.get<AuthResponse>(`${this.API_URL}/check-status`).pipe(
      tap((response) => {
        this._authStatus.set(response);
        if (response.access_token) {
          localStorage.setItem('token', response.access_token);
        }
      }),
      map(() => true),
      catchError((error) => {
        this.logout();
        return of(false);
      }),
      shareReplay(1)
    );

    return this._checkStatus$;
  }
}
