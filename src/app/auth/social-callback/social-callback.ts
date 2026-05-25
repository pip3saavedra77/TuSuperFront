import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // Read from window.location.hash since the backend redirects using fragment (#token=)
    // instead of query parameter (?token=) to protect the JWT from proxy/CDN logs and referer leaks.
    let token = this.route.snapshot.queryParamMap.get('token');

    if (!token && window.location.hash) {
      const hash = window.location.hash.slice(1); // remove '#'
      const params = new URLSearchParams(hash);
      token = params.get('token');
    }
    
    if (token) {
      localStorage.setItem('token', token);
      // Opcional: Podrías llamar a un endpoint de 'me' para obtener los datos del usuario 
      // o simplemente confiar en el check-status posterior.
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { error: 'social_auth_failed' } });
    }
  }
}
