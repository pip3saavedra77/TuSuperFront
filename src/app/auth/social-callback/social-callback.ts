import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { TokenService } from '../../core/services/token.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs';

@Component({
  selector: 'app-social-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Procesando inicio de sesión...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
      font-family: 'Inter', sans-serif;
      color: #4B5563;
    }
  `]
})
export class SocialCallback implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);

  ngOnInit(): void {
    let token: string | null = null;
    let refreshToken: string | null = null;

    if (globalThis.location.hash) {
      const hash = globalThis.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      token = params.get('token');
      refreshToken = params.get('refresh_token');
    }

    if (!token && globalThis.location.search) {
      const params = new URLSearchParams(globalThis.location.search);
      token = params.get('token');
      refreshToken = params.get('refresh_token');
    }

    if (token) {
      this.tokenService.set(token, true);
      if (refreshToken) {
        this.tokenService.setRefreshToken(refreshToken);
      }
      globalThis.history.replaceState(null, '', '/auth/social-callback');

      this.authService.checkAuthStatus().pipe(take(1)).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => {
          this.router.navigate(['/home']);
        },
      });
      return;
    }

    this.authService.checkAuthStatus().pipe(take(1)).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => {
        this.router.navigate(['/auth/login'], { queryParams: { error: 'social_auth_failed' } });
      },
    });
  }
}
