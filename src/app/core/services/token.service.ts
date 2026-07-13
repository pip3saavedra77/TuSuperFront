import { Injectable } from '@angular/core';

const PERSIST_FLAG = 'token_persistent';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private _token: string | null = null;
  private _refreshToken: string | null = null;

  get(): string | null {
    return this._token;
  }

  set(token: string, persistent: boolean): void {
    this._token = token;
    localStorage.setItem(PERSIST_FLAG, persistent ? '1' : '0');
  }

  getRefreshToken(): string | null {
    return this._refreshToken;
  }

  setRefreshToken(token: string): void {
    this._refreshToken = token;
  }

  clear(): void {
    this._token = null;
    this._refreshToken = null;
    localStorage.removeItem(PERSIST_FLAG);
  }

  isPersistent(): boolean {
    return localStorage.getItem(PERSIST_FLAG) === '1';
  }
}
