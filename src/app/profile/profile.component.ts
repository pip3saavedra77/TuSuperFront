import { Component, inject, computed, signal, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../core/services/auth';

import { UsersService } from '../users/services/users.service';



@Component({

  selector: 'app-profile',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    MatButtonModule,

    MatIconModule,

    MatFormFieldModule,

    MatInputModule,

    MatProgressSpinnerModule,

    MatSnackBarModule,

  ],

  templateUrl: './profile.component.html',

  styleUrls: ['./profile.component.scss']

})

export class ProfileComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly usersService = inject(UsersService);

  private readonly snackBar = inject(MatSnackBar);



  public readonly currentUser = this.authService.currentUser;

  

  public profileForm!: FormGroup;

  public passwordForm!: FormGroup;



  public isEditingProfile = signal(false);

  public isChangingPassword = signal(false);

  

  public isSavingProfile = signal(false);

  public isSavingPassword = signal(false);



  public showCurrentPassword = signal(false);

  public showNewPassword = signal(false);

  public showConfirmPassword = signal(false);



  public selectedAvatarFile = signal<File | null>(null);

  public avatarPreviewUrl = signal<string | null>(null);

  public isUploadingAvatar = signal(false);



  ngOnInit(): void {

    this.initForms();

  }



  private initForms(): void {

    const user = this.currentUser();

    this.profileForm = this.fb.group({

      firstName: [user?.firstName || '', [Validators.required]],

      lastName: [user?.lastName || '', [Validators.required]],

    });



    this.passwordForm = this.fb.group({

      currentPassword: ['', [Validators.required]],

      newPassword: ['', [Validators.required, Validators.minLength(8)]],

      confirmPassword: ['', [Validators.required]],

    }, { validators: this.passwordMatchValidator });

  }



  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {

    const password = control.get('newPassword');

    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {

      confirmPassword.setErrors({ passwordMismatch: true });

      return { passwordMismatch: true };

    }

    return null;

  }



  public toggleEditProfile(): void {

    if (this.isEditingProfile()) {

      const user = this.currentUser();

      this.profileForm.patchValue({

        firstName: user?.firstName || '',

        lastName: user?.lastName || '',

      });

      this.isEditingProfile.set(false);

    } else {

      this.isEditingProfile.set(true);

    }

  }



  public toggleChangePassword(): void {

    if (this.isChangingPassword()) {

      this.passwordForm.reset();

      this.isChangingPassword.set(false);

    } else {

      this.isChangingPassword.set(true);

    }

  }



  public updateProfile(): void {

    if (this.profileForm.invalid || this.isSavingProfile()) return;



    this.isSavingProfile.set(true);

    this.usersService.updateMyProfile(this.profileForm.value).subscribe({

      next: () => {

        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });

        this.isEditingProfile.set(false);

        this.isSavingProfile.set(false);

        this.authService.checkAuthStatus().subscribe();

      },

      error: (err) => {

        const errorMsg = err.error?.message || 'Error al actualizar el perfil';

        this.snackBar.open(errorMsg, 'Cerrar', { duration: 4000 });

        this.isSavingProfile.set(false);

      }

    });

  }



  public updatePassword(): void {

    if (this.passwordForm.invalid || this.isSavingPassword()) return;



    this.isSavingPassword.set(true);

    const { currentPassword, newPassword } = this.passwordForm.value;

    

    this.usersService.updateMyPassword({ currentPassword, newPassword }).subscribe({

      next: () => {

        this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', { duration: 3000 });

        this.passwordForm.reset();

        this.isChangingPassword.set(false);

        this.isSavingPassword.set(false);

      },

      error: (err) => {

        const errorMsg = err.error?.message || 'Error al cambiar la contraseña';

        this.snackBar.open(errorMsg, 'Cerrar', { duration: 4000 });

        this.isSavingPassword.set(false);

      }

    });

  }





  // ── Avatar handlers ────────────────────────────────────



  onAvatarSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;



    const file = input.files[0];

    const maxSize = 5 * 1024 * 1024; // 5 MB

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];



    if (file.size > maxSize) {

      this.snackBar.open('La imagen no debe superar 5 MB', 'Cerrar', { duration: 4000 });

      return;

    }



    if (!allowedTypes.includes(file.type)) {

      this.snackBar.open('Solo se permiten imágenes PNG, JPG o WebP', 'Cerrar', { duration: 4000 });

      return;

    }



    this.selectedAvatarFile.set(file);

    const reader = new FileReader();

    reader.onload = () => this.avatarPreviewUrl.set(reader.result as string);

    reader.readAsDataURL(file);

  }





  uploadAvatar(): void {

    const file = this.selectedAvatarFile();

    if (!file) return;



    this.isUploadingAvatar.set(true);

    this.usersService.uploadMyAvatar(file).subscribe({

      next: () => {

        this.snackBar.open('Foto de perfil actualizada', 'Cerrar', { duration: 3000 });

        this.selectedAvatarFile.set(null);

        this.avatarPreviewUrl.set(null);

        this.isUploadingAvatar.set(false);

        this.authService.checkAuthStatus().subscribe();

      },

      error: (err) => {

        const msg = err.error?.message || 'Error al subir la imagen';

        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });

        this.isUploadingAvatar.set(false);

      }

    });

  }





  removeAvatar(): void {

    this.usersService.removeMyAvatar().subscribe({

      next: () => {

        this.snackBar.open('Foto de perfil eliminada', 'Cerrar', { duration: 3000 });

        this.authService.checkAuthStatus().subscribe();

      },

      error: () => {

        this.snackBar.open('Error al eliminar la foto de perfil', 'Cerrar', { duration: 4000 });

      }

    });

  }





  clearAvatarSelection(): void {

    this.selectedAvatarFile.set(null);

    this.avatarPreviewUrl.set(null);

  }

}

