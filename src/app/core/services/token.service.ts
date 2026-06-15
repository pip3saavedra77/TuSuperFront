import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  set(token: string, persistent: boolean): void {
    this.clear();
    if (persistent) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  isPersistent(): boolean {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }
}
