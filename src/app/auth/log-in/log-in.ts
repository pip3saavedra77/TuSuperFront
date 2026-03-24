import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// Material 3 Imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoginInterface } from '../interfaces/login';
import { Auth } from '../services/auth';

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
    MatCheckboxModule
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn {

  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  hidePassword = true;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const rawForm = this.loginForm.value as LoginInterface;

      this.authService.login(rawForm).subscribe({
        next: (res) => {
          console.log('Usuario autenticado:', res);
          // Aquí podrías usar el Router para ir al home
          // this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // Aquí podrías mostrar un mensaje con MatSnackBar
          console.error('Error en login:', err.error.message);
        }
      });
    }
  }

}
