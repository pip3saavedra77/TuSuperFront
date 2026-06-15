import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdleService implements OnDestroy {
  private _idleTimeout = 15 * 60 * 1000;
  private _isWatching = false;
  private _timerId: ReturnType<typeof setTimeout> | null = null;
  private _eventCleanups: Array<() => void> = [];

  readonly isIdle = signal(false);
  readonly idleWarning = signal(false);
  readonly lastActivity = signal<number>(Date.now());

  startWatching(timeoutMinutes = 15): void {
    this.stopWatching();
    this._idleTimeout = timeoutMinutes * 60 * 1000;
    this._isWatching = true;
    this.lastActivity.set(Date.now());
    this._scheduleCheck();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => this._resetTimer();
    events.forEach(event => {
      window.addEventListener(event, handler);
      this._eventCleanups.push(() => window.removeEventListener(event, handler));
    });

    const onVisibility = () => {
      if (!document.hidden) {
        this._resetTimer();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    this._eventCleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));
  }

  dismissWarning(): void {
    this.idleWarning.set(false);
    this._resetTimer();
  }

  stopWatching(): void {
    this._isWatching = false;
    this.isIdle.set(false);
    this.idleWarning.set(false);
    this._eventCleanups.forEach(fn => fn());
    this._eventCleanups = [];
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  private _scheduleCheck(): void {
    if (!this._isWatching) return;
    if (this._timerId !== null) clearTimeout(this._timerId);
    this._timerId = setTimeout(() => {
      if (!this._isWatching) return;
      if (document.hidden) {
        this._scheduleCheck();
        return;
      }
      const elapsed = Date.now() - this.lastActivity();
      if (elapsed >= this._idleTimeout) {
        this.isIdle.set(true);
      } else if (elapsed >= this._idleTimeout * 0.5) {
        this.idleWarning.set(true);
        this._scheduleCheck();
      } else {
        this._scheduleCheck();
      }
    }, Math.min(this._idleTimeout * 0.5, 30_000));
  }

  private _resetTimer(): void {
    if (!this._isWatching) return;
    this.lastActivity.set(Date.now());
    this.isIdle.set(false);
    this.idleWarning.set(false);
    this._scheduleCheck();
  }
}
