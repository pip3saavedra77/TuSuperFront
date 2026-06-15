import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { TokenService } from '../../core/services/token.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const JWT_REGEX = /^[A-Za-z0-9\-._~+/]+=*$/;

function isValidJwtFormat(token: string): boolean {
  return token.length > 20 && JWT_REGEX.test(token);
}

@Component({
  selector: 'app-social-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Procesando inicio de sesion...</p>
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);

  ngOnInit(): void {
    let token = this.route.snapshot.queryParamMap.get('token');

    if (!token && globalThis.location.hash) {
      const hash = globalThis.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      token = params.get('token');
    }

    if (token && isValidJwtFormat(token)) {
      this.tokenService.set(token, true);
      this.authService.checkAuthStatus().subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => {
          this.tokenService.clear();
          this.router.navigate(['/auth/login'], { queryParams: { error: 'social_auth_failed' } });
        },
      });
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { error: 'social_auth_failed' } });
    }
  }
}
