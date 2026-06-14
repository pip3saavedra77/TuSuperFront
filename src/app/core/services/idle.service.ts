import { Injectable, inject, NgZone } from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { AuthService } from './auth';

const IDLE_TIMEOUT = 120 * 60 * 1000; // 2 horas

@Injectable({ providedIn: 'root' })
export class IdleService {
  private readonly authService = inject(AuthService);
  private readonly zone = inject(NgZone);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: Subscription | null = null;

  startWatching(): void {
    if (this.subscriptions) return;

    this.zone.runOutsideAngular(() => {
      this.subscriptions = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'click'),
        fromEvent(document, 'scroll'),
      )
        .pipe(throttleTime(5000))
        .subscribe(() => this.resetTimer());

      this.resetTimer();
    });
  }

  stopWatching(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.subscriptions?.unsubscribe();
    this.subscriptions = null;
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.zone.run(() => {
        this.authService.logout();
      });
    }, IDLE_TIMEOUT);
  }
}
