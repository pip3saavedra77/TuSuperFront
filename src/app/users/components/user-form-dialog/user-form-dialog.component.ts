import { CommonModule } from '@angular/common';

import { Component, Inject, OnInit, inject, DestroyRef } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { MatIconModule } from '@angular/material/icon';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Role } from '../../../core/models/auth.models';

import { User } from '../../../core/models/user.model';

import { UsersService } from '../../services/users.service';



@Component({

  selector: 'app-user-form-dialog',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    MatDialogModule,

    MatButtonModule,

    MatFormFieldModule,

    MatInputModule,

    MatSelectModule,

    MatIconModule,

    MatSnackBarModule

  ],

  templateUrl: './user-form-dialog.component.html',

  styleUrls: ['./user-form-dialog.component.scss']

})

export class UserFormDialogComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly usersService = inject(UsersService);

  private readonly snackBar = inject(MatSnackBar);

  public readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  private readonly destroyRef = inject(DestroyRef);



  userForm!: FormGroup;

  roles: Role[] = [];

  isEditMode = false;

  isLoading = false;

  hidePassword = true;



  constructor(@Inject(MAT_DIALOG_DATA) public data: { user?: User }) {

    this.isEditMode = !!data?.user;

    this.initForm();

  }



  ngOnInit(): void {

    this.loadRoles();

  }



  private initForm(): void {

    this.userForm = this.fb.group({

      firstName: [this.data?.user?.firstName || '', [Validators.required]],

      lastName: [this.data?.user?.lastName || '', [Validators.required]],

      email: [this.data?.user?.email || '', [Validators.required, Validators.email]],

      password: ['', this.isEditMode ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],

      roleIds: [this.data?.user?.roles.map(r => r.id) || [], [Validators.required]]

    });

  }



  private loadRoles(): void {

    this.usersService.getRoles()

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe({

        next: (roles) => this.roles = roles,

        error: () => this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 })

      });

  }



  save(): void {

    if (this.userForm.invalid) return;



    this.isLoading = true;

    const payload = this.userForm.value;

    

    // Si es edición y el password está vacío, lo eliminamos del payload

    if (this.isEditMode && !payload.password) {

      delete payload.password;

    }



    const request = this.isEditMode

      ? this.usersService.updateUser(this.data.user!.id, payload)

      : this.usersService.createUser(payload);



    request.subscribe({

      next: (user) => {

        this.snackBar.open(`Usuario ${this.isEditMode ? 'actualizado' : 'creado'} con éxito`, 'Cerrar', { duration: 3000 });

        this.dialogRef.close(user);

      },

      error: (err) => {

        this.isLoading = false;

        const errorMsg = err.error?.message || 'Error al procesar la solicitud';

        this.snackBar.open(errorMsg, 'Cerrar', { duration: 3000 });

      }

    });

  }

}

