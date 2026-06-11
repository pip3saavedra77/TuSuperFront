import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AnimatedCharacters } from '../animated-characters/animated-characters';
import { LoadingScreen } from '../../shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-reset-password',
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
    MatProgressSpinnerModule,
    AnimatedCharacters,
    LoadingScreen,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  isCheckingToken = signal(true);
  isTokenValid = signal(false);
  isLoading = signal(false);
  isSuccess = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  errorMessage = signal('');
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
    this.typingTimeout = window.setTimeout(() => {
      this.isTyping.set(false);
    }, 300);
  }

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.isCheckingToken.set(false);
      this.isTokenValid.set(false);
      return;
    }

    this.authService.validateResetToken(this.token).subscribe({
      next: (res) => {
        this.isCheckingToken.set(false);
        this.isTokenValid.set(res.valid);
      },
      error: () => {
        this.isCheckingToken.set(false);
        this.isTokenValid.set(false);
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private stopLoading(): void {
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = Math.max(0, 5000 - elapsed);
    setTimeout(() => this.isLoading.set(false), remaining);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.loadingStartTime = Date.now();
    this.errorMessage.set('');

    const newPassword = this.resetForm.getRawValue().password ?? '';

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.stopLoading();
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.stopLoading();
        const message = err.error?.message || 'Error al restablecer la contraseña';
        this.errorMessage.set(message);
      },
    });
  }
}
