import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { AuthService } from './core/services/auth';
import { InitService } from './core/services/init.service';

registerLocaleData(localeEsCO, 'es-CO');

export function initializeAuthFactory(authService: AuthService): () => Promise<void> {
  // Resolve immediately to unblock Angular bootstrap.
  // Auth runs in background; loading screen is shown by App component via InitService.
  return () => {
    authService.initializeAuth();
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
    ),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    InitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthFactory,
      deps: [AuthService],
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // registerWhenStable:3000 — 3s is enough for initial render to stabilize.
      // Zone.js never fully stabilizes due to IdleService timers, Socket.IO, etc.
      // Using 30s caused the exact 30-second blank screen on Safari/Brave mobile.
      registrationStrategy: 'registerWhenStable:3000',
    }),
  ]
};
