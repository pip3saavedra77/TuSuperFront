import { Injectable, inject, NgZone, signal } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { AuthService } from './auth';

const SHORT_TIMEOUT = 30 * 60 * 1000;
const LONG_TIMEOUT = 120 * 60 * 1000;
const WARNING_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: Subscription | null = null;

  readonly idleWarning = signal(false);

  startWatching(): void {
    if (this.subscriptions) return;

    this.zone.runOutsideAngular(() => {
      this.subscriptions = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'wheel'),
      )
        .pipe(throttleTime(5000))
        .subscribe(() => this.resetTimer());

      this.resetTimer();
    });
  }

  stopWatching(): void {
    this._clearTimers();
    this.subscriptions?.unsubscribe();
    this.subscriptions = null;
  }

  dismissWarning(): void {
    this.idleWarning.set(false);
    this.resetTimer();
  }

  private resetTimer(): void {
    this._clearTimers();
    this.idleWarning.set(false);

    const timeout = this.authService.isSessionPersistent() ? LONG_TIMEOUT : SHORT_TIMEOUT;

    this.warningId = setTimeout(() => {
      this.zone.run(() => this.idleWarning.set(true));
    }, timeout - WARNING_MS);

    this.timeoutId = setTimeout(() => {
      this.zone.run(() => {
        this.idleWarning.set(false);
        this.authService.logout();
      });
    }, timeout);
  }

  private _clearTimers(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningId !== null) {
      clearTimeout(this.warningId);
      this.warningId = null;
    }
  }
}
