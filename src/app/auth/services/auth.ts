import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginInterface } from '../interfaces/login';
// import { LoginInterface } from '../interfaces/login';

// export interface AuthResponse {
//   accessToken: string;
//   user: {
//     id: number;
//     email: string;
//     role: string; // Importante por tu RBAC
//   };
// }

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
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        // Guardamos en la Signal el objeto que contiene access_token y user
        this._authStatus.set(response);
        // Persistencia básica para recargas de página
        localStorage.setItem('token', response.access_token);
      })
    );
  }

  public logout(): void {
    this._authStatus.set(null);
    localStorage.removeItem('token');
  }

  // public login(user: LoginInterface){
  //   this.http.post<LoginInterface>(`http://localhost:3000/users`, user).subscribe(data => {
  //     // ... Aqui es donde pienso darle un valor al signal que vamos a configurar
  //   });
  // }
}
