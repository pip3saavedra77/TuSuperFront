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
    const token = this.route.snapshot.queryParamMap.get('token');
    
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
