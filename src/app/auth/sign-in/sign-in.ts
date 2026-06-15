import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { passwordMatchValidator } from '../../shared/validators/password-match.validator';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { PasswordStrengthComponent } from '../../shared/components/password-strength/password-strength';
import { AnimatedCharacters } from '../animated-characters/animated-characters';
import { LoadingScreen } from '../../shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatSnackBarModule,
    PasswordStrengthComponent,
    AnimatedCharacters,
    LoadingScreen
  ],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss'
})
export class SignIn {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  hidePassword = true;
  hideConfirmPassword = true;
  loading = signal(false);
  activeStep = 1;
  isTyping = signal(false);
  private typingTimeout: number | null = null;
  private loadingStartTime = 0;

  selectStep(step: number): void {
    this.activeStep = step;
  }

  onTyping(): void {
    this.isTyping.set(true);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = globalThis.setTimeout(() => {
      this.isTyping.set(false);
    }, 300);
  }

  registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    termsAccepted: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

  private stopLoading(): void {
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = Math.max(0, 5000 - elapsed);
    setTimeout(() => this.loading.set(false), remaining);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.loadingStartTime = Date.now();

    const { firstName, lastName, email, password, confirmPassword } = this.registerForm.getRawValue();

    this.authService.register({
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      password: password!,
      confirmPassword: confirmPassword!
    }).subscribe({
      next: () => {
        this.snackBar.open('Registro exitoso', 'Cerrar', { duration: 3000 });
        this.stopLoading();
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        let message = 'Error al procesar el registro. Intentalo de nuevo.';
        if (err.status === 400 && err.error?.message) {
          const msgs = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
          if (typeof msgs === 'string' && !msgs.toLowerCase().includes('registrado')) {
            message = msgs;
          }
        }

        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.stopLoading();
      }
    });
  }
}
