import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { Provider, CreateProviderPayload } from '../../core/models/provider.model';



export interface ProviderDialogData {

  provider?: Provider;

}



@Component({

  selector: 'app-provider-form-dialog',

  standalone: true,

  imports: [

    CommonModule,

    ReactiveFormsModule,

    MatDialogModule,

    MatFormFieldModule,

    MatInputModule,

    MatButtonModule,

    MatIconModule

  ],

  template: `

    <form [formGroup]="providerForm" (ngSubmit)="onSave()" class="form-dialog">

      <header class="form-dialog__header">

        <div class="form-dialog__icon">

          <mat-icon>local_shipping</mat-icon>

        </div>

        <div class="form-dialog__heading">

          <h2 class="form-dialog__title">{{ data.provider ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h2>

          <p class="form-dialog__subtitle">

            {{ data.provider ? 'Actualiza los datos de contacto del proveedor.' : 'Registra un nuevo proveedor para tu inventario.' }}

          </p>

        </div>

        <button mat-icon-button type="button" class="form-dialog__close" (click)="onCancel()" aria-label="Cerrar">

          <mat-icon>close</mat-icon>

        </button>

      </header>



      <mat-dialog-content class="form-dialog__body">

        <mat-form-field appearance="outline" class="full-width">

          <mat-label>Nombre / Razón Social</mat-label>

          <input matInput formControlName="name" placeholder="Ej: Distribuidora S.A.S" maxlength="150">

          <mat-icon matSuffix>business</mat-icon>

          <mat-error *ngIf="providerForm.get('name')?.hasError('required')">

            El nombre es obligatorio

          </mat-error>

        </mat-form-field>



        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">

          <mat-label>Teléfono</mat-label>

          <input matInput formControlName="phone" placeholder="3001234567" maxlength="10">

          <mat-icon matSuffix>call</mat-icon>

          <mat-hint>10 dígitos sin espacios</mat-hint>

          <mat-error *ngIf="providerForm.get('phone')?.hasError('pattern')">

            Debe ser un número válido de 10 dígitos

          </mat-error>

        </mat-form-field>



        <mat-form-field appearance="outline" class="full-width">

          <mat-label>Correo electrónico</mat-label>

          <input matInput formControlName="email" type="email" placeholder="contacto@empresa.com">

          <mat-icon matSuffix>mail</mat-icon>

          <mat-error *ngIf="providerForm.get('email')?.hasError('email')">

            Ingrese un correo válido

          </mat-error>

        </mat-form-field>

      </mat-dialog-content>



      <mat-dialog-actions class="form-dialog__actions">

        <button mat-button type="button" class="form-dialog__btn-cancel" (click)="onCancel()">Cancelar</button>

        <button mat-flat-button

                type="submit"

                class="form-dialog__btn-submit"

                [disabled]="providerForm.invalid">

          {{ data.provider ? 'Actualizar' : 'Crear proveedor' }}

        </button>

      </mat-dialog-actions>

    </form>

  `,

  styles: [`

    :host ::ng-deep .form-dialog .full-width { width: 100%; }

  `]

})

export class ProviderFormDialogComponent {

  private readonly fb = inject(FormBuilder);

  private readonly dialogRef = inject(MatDialogRef<ProviderFormDialogComponent>);

  readonly data: ProviderDialogData = inject(MAT_DIALOG_DATA);



  readonly providerForm = this.fb.nonNullable.group({

    name: [this.data.provider?.name ?? '', [Validators.required, Validators.maxLength(150)]],

    phone: [this.data.provider?.phone ?? '', [Validators.pattern(/^[0-9]{10}$/)]],

    email: [this.data.provider?.email ?? '', [Validators.email]]

  });



  onCancel(): void {

    this.dialogRef.close();

  }



  onSave(): void {

    if (this.providerForm.valid) {

      const payload: CreateProviderPayload = this.providerForm.getRawValue();

      this.dialogRef.close(payload);

    }

  }

}

