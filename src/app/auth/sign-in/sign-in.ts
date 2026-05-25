import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth';
import { PasswordStrengthComponent } from '../../shared/components/password-strength/password-strength';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) return null;

  if (password.value !== confirmPassword.value && confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
    }
    return null;
  }
};

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    PasswordStrengthComponent
  ],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.scss']
})
export class SignIn {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  public hidePassword = true;
  public hideConfirmPassword = true;
  public loading = signal<boolean>(false);
  public activeStep = 1;

  public selectStep(step: number): void {
    this.activeStep = step;
  }

  public registerForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  public onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading.set(true);

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
        this.router.navigateByUrl('/home');
        this.loading.set(false);
      },
      error: (err) => {
        let message = 'Error al registrar usuario';
        if (err.status === 409) {
          message = 'Este email ya está registrado';
        } else if (err.status === 400 && err.error?.message) {
          message = Array.isArray(err.error.message) ? err.error.message[0] : err.error.message;
        }

        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading.set(false);
      }
    });
  }
}
