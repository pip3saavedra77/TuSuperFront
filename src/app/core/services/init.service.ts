import { Injectable, signal } from '@angular/core';

/**
 * Service to manage app initialization state.
 * Used by APP_INITIALIZER to show/hide loading screen.
 */
@Injectable({ providedIn: 'root' })
export class InitService {
  private readonly _isInitializing = signal(true);
  private readonly _initMessage = signal('Preparando tu experiencia');
  private readonly _initSubmessage = signal('Estamos organizando los productos para ti');
  private readonly _isColdStart = signal(false);
  private _coldStartTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isInitializing = this._isInitializing.asReadonly();
  readonly initMessage = this._initMessage.asReadonly();
  readonly initSubmessage = this._initSubmessage.asReadonly();
  readonly isColdStart = this._isColdStart.asReadonly();

  /** Mark initialization as started - call from APP_INITIALIZER factory */
  start(): void {
    this._isInitializing.set(true);
    this._isColdStart.set(false);
    // Detect cold start: if init takes > 5s, show "Waking up..." message
    this._coldStartTimer = setTimeout(() => {
      this._isColdStart.set(true);
      this._initMessage.set('Despertando el servidor...');
      this._initSubmessage.set('El backend se está iniciando, esto puede tardar unos segundos');
    }, 5000);
  }

  /** Mark initialization as complete - call when APP_INITIALIZER promise resolves */
  complete(): void {
    if (this._coldStartTimer) {
      clearTimeout(this._coldStartTimer);
      this._coldStartTimer = null;
    }
    this._isInitializing.set(false);
  }

  /** Set custom loading message */
  setMessage(message: string, submessage?: string): void {
    if (!this._isColdStart()) {
      this._initMessage.set(message);
      if (submessage) this._initSubmessage.set(submessage);
    }
  }
}