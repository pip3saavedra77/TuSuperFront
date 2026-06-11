import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoginCredentials } from '../interfaces/login';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { getHttpErrorMessage } from '../../core/utils/http-error-message';
import { HttpErrorResponse } from '@angular/common/http';
import { AnimatedCharacters } from '../animated-characters/animated-characters';
import { LoadingScreen } from '../../shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    AnimatedCharacters,
    LoadingScreen,
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  hidePassword = true;
  activeStep = 1;
  loading = signal(false);
  rememberMe = signal(false);
  failedAttempts = signal(0);
  shakeForm = signal(false);
  errorMessage = signal('');
  isTyping = signal(false);
  typingTimeout: number | null = null;
  private loadingStartTime = 0;

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail });
      this.rememberMe.set(true);
    }
  }

  selectStep(step: number): void {
    this.activeStep = step;
  }

  onTyping(): void {
    this.isTyping.set(true);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = window.setTimeout(() => {
      this.isTyping.set(false);
    }, 300);
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private stopLoading(): void {
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = Math.max(0, 5000 - elapsed);
    setTimeout(() => this.loading.set(false), remaining);
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.loadingStartTime = Date.now();
    this.errorMessage.set('');

    const { email, password } = this.loginForm.getRawValue();
    const credentials: LoginCredentials = {
      email: email ?? '',
      password: password ?? '',
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.failedAttempts.set(0);
        if (this.rememberMe()) {
          localStorage.setItem('remember_email', email ?? '');
        } else {
          localStorage.removeItem('remember_email');
        }
        this.stopLoading();
        this.router.navigate(['/home']);
      },
      error: (err: unknown) => {
        this.stopLoading();
        this.shakeForm.set(true);
        setTimeout(() => this.shakeForm.set(false), 500);

        this.loginForm.patchValue({ password: '' });
        const attempts = this.failedAttempts() + 1;
        this.failedAttempts.set(attempts);

        let message = getHttpErrorMessage(
          err as HttpErrorResponse,
          'Correo o contraseña incorrectos',
        );
        // Translate common backend English messages
        if (message.toLowerCase().includes('invalid credentials')) {
          message = 'Correo o contraseña incorrectos';
        }
        if (attempts >= 3) {
          message += '. ¿Olvidaste tu contraseña? Usa el enlace de recuperación.';
        }
        this.errorMessage.set(message);
      },
    });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
