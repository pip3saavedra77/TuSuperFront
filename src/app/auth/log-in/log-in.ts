import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoginCredentials } from '../interfaces/login';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { getHttpErrorMessage } from '../../core/utils/http-error-message';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  hidePassword = true;
  activeStep = 1;
  loading = signal(false);
  rememberMe = signal(false);
  failedAttempts = signal(0);
  shakeForm = signal(false);

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

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading()) return;

    this.loading.set(true);

    const { email, password } = this.loginForm.getRawValue();
    const credentials: LoginCredentials = {
      email: email ?? '',
      password: password ?? '',
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        if (this.rememberMe()) {
          localStorage.setItem('remember_email', email ?? '');
        } else {
          localStorage.removeItem('remember_email');
        }
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.shakeForm.set(true);
        setTimeout(() => this.shakeForm.set(false), 500);

        // Clear password field so user can retype quickly
        this.loginForm.patchValue({ password: '' });

        const attempts = this.failedAttempts() + 1;
        this.failedAttempts.set(attempts);

        let message = getHttpErrorMessage(
          err as HttpErrorResponse,
          'Correo o contraseña incorrectos',
        );

        // Suggest forgot-password after 3 failed attempts
        if (attempts >= 3) {
          message += '. ¿Olvidaste tu contraseña? Usa el enlace de recuperación abajo.';
        }

        this.snackBar.open(message, 'Cerrar', { duration: 6000 });
      },
    });
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
