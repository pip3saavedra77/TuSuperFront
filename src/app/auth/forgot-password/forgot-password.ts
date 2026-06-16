import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth';
import { AnimatedCharacters } from '../animated-characters/animated-characters';
import { LoadingScreen } from '../../shared/components/loading-screen/loading-screen';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    AnimatedCharacters,
    LoadingScreen,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  isLoading = signal(false);
  successMessage = signal('');
  activeStep = 1;
  isTyping = signal(false);
  private typingTimeout: number | null = null;
  hidePassword = true;
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

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private stopLoading(): void {
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = Math.max(0, 5000 - elapsed);
    setTimeout(() => this.isLoading.set(false), remaining);
  }

  onSubmit(): void {
    if (this.forgotForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.loadingStartTime = Date.now();
    this.successMessage.set('');

    const email = this.forgotForm.getRawValue().email ?? '';

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.stopLoading();
        this.successMessage.set(response.message);
        this.forgotForm.reset();
      },
      error: () => {
        this.stopLoading();
        this.successMessage.set('Si el correo electrónico existe, recibirás instrucciones para restablecer tu contraseña.');
      },
    });
  }
}
