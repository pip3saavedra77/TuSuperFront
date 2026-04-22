import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { LoginInterface } from '../../auth/interfaces/login';
import { Router } from '@angular/router';

export interface Module {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  modules: Module[]; // Los módulos a los que este rol da acceso
}

export interface User {
  id: number;
  name: string;
  lastName: string;
  docType: string;
  docNumber: string;
  email: string;
  isActive: boolean;
  roles: Role[]; // Nota que es un array según tu JSON
}

export interface AuthResponse {
  access_token: string; // Coincide con el snake_case de tu backend
  user: User;
}


@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = 'http://localhost:3000/auth';

  // 1. Estado privado (Signal) - Almacena el objeto completo del back
  private _authStatus = signal<AuthResponse | null>(null);

  // 2. Selectores públicos (Computed) - Reaccionan automáticamente
  public currentUser = computed(() => this._authStatus()?.user);
  public isAuthenticated = computed(() => !!this._authStatus());

  // Selector para obtener los permisos (módulos) de forma aplanada
  public userModules = computed(() => {
    const user = this._authStatus()?.user;
    return user ? user.roles.flatMap(r => r.modules.map(m => m.name)) : [];
  });

  /** Método principal de Login */
  public login(credentials: LoginInterface): Observable<AuthResponse> {
    // LIMPIEZA PREVENTIVA
    localStorage.clear();

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        // Guardamos datos nuevos
        localStorage.setItem('token', response.access_token);
        this._authStatus.set(response);
      })
    );
  }
  // public login(credentials: LoginInterface): Observable<AuthResponse> {
  //   return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
  //     tap((response) => {
  //       localStorage.clear(); // Limpia rastros del usuario anterior (Admin)
  //       localStorage.setItem('token', response.access_token);
  //       this._authStatus.set(response);
  //     })
  //   );
  // }

  public logout(): void {
    localStorage.clear();

    // 2. Resetear el Signal de estado
    this._authStatus.set(null);

    // 3. Navegar y FORZAR recarga (esto limpia la memoria de JS)
    this.router.navigateByUrl('/auth').then(() => {
      window.location.reload();
    });
  }

  // public checkAuthStatus(): Observable<boolean> {
  //   const token = localStorage.getItem('token'); // Asegúrate que la llave sea exactamente 'token'
  //   if (!token) return of(false);

  //   // Inyectamos el header manualmente aquí
  //   return this.http.get<AuthResponse>(`${this.API_URL}/check-status`).pipe(
  //     tap((response) => {
  //       console.log('2. Respuesta del servidor (User):', response.user.email); // <--- DEBUG
  //       this._authStatus.set(response);
  //       localStorage.setItem('token', response.access_token);
  //       // this._authStatus.set(response);
  //       // localStorage.setItem('token', response.access_token);
  //     }),
  //     map(() => true),
  //     catchError(() => {
  //       this.logout();
  //       return of(false);
  //     })
  //   );
  // }

  public checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) return of(false);

    // Añadimos un timestamp para evitar que el navegador use una respuesta cacheada
    // const params = { t: new Date().getTime().toString() };

    return this.http.get<AuthResponse>(`${this.API_URL}/check-status`).pipe(
      tap((response) => {
        console.log('Validando sesión de:', response.user.email);
        this._authStatus.set(response);
        // Solo actualiza el token si el servidor generó uno nuevo
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
