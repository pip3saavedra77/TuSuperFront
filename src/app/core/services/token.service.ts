import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const PERSIST_FLAG = 'token_persistent';

/**
 * Siempre usa localStorage (iOS PWA purga sessionStorage al minimizar).
 * La bandera `token_persistent` preserva la elección del usuario.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  set(token: string, persistent: boolean): void {
    this.clear();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PERSIST_FLAG, persistent ? '1' : '0');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(PERSIST_FLAG);
  }

  isPersistent(): boolean {
    return localStorage.getItem(PERSIST_FLAG) === '1';
  }
}
