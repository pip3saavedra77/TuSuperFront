import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
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
    this.router.navigateByUrl('/auth');
  }

  public checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) return of(false);

    return this.http.get<AuthResponse>(`${this.API_URL}/check-status`).pipe(
      tap((response) => {
        this._authStatus.set(response);
        localStorage.setItem('token', response.access_token);
      }),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }
}
