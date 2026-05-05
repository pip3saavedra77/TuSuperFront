import { Component, inject } from '@angular/core';
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
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-in',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  hidePassword = true;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.getRawValue();
    const credentials: LoginCredentials = {
      email: email ?? '',
      password: password ?? '',
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err: unknown) => {
        const message = (err as { error?: { message?: string } })?.error?.message
          ?? 'Error de autenticación';
        alert(message);
      },
    });
  }
}
