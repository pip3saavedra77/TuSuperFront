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
  return () => authService.initializeAuth();
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
      // registerWhenStable:30000 waits up to 30s for Angular to stabilize.
      // More reliable on iOS where timers/polling may keep the zone busy.
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
};
