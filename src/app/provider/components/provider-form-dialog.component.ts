import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule
  ],
  template: `
    <form [formGroup]="providerForm" (ngSubmit)="onSave()">
      <h2 mat-dialog-title>{{ data.provider ? 'Editar' : 'Nuevo' }} Proveedor</h2>
      <mat-dialog-content class="provider-form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre / Razón Social</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Distribuidora S.A.S" maxlength="150">
          <mat-error *ngIf="providerForm.get('name')?.hasError('required')">
            El nombre es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono (10 dígitos)</mat-label>
          <input matInput formControlName="phone" placeholder="3001234567" maxlength="10">
          <mat-error *ngIf="providerForm.get('phone')?.hasError('pattern')">
            Debe ser un número válido de 10 dígitos
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Correo electrónico</mat-label>
          <input matInput formControlName="email" type="email" placeholder="contacto@empresa.com">
          <mat-error *ngIf="providerForm.get('email')?.hasError('email')">
            Ingrese un correo válido
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-flat-button color="primary" 
                type="submit"
                [disabled]="providerForm.invalid">
          {{ data.provider ? 'Actualizar' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .provider-form-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 1rem;
    }
    .full-width {
      width: 100%;
    }
    h2 {
        margin: 0;
        color: var(--color-primary-dark, #065f46);
    }
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
