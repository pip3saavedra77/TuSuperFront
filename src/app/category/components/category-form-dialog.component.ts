import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Category, CreateCategoryPayload } from '../../core/models/category.model';

export interface CategoryDialogData {
  category?: Category;
}

@Component({
  selector: 'app-category-form-dialog',
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
    <form [formGroup]="categoryForm" (ngSubmit)="onSave()">
      <h2 mat-dialog-title>{{ data.category ? 'Editar' : 'Nueva' }} Categoría</h2>
      <mat-dialog-content class="category-form-content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Lácteos" maxlength="100">
          <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
            El nombre es obligatorio
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Opcional..."></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-flat-button color="primary" 
                type="submit"
                [disabled]="categoryForm.invalid">
          {{ data.category ? 'Actualizar' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .category-form-content {
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
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  readonly data: CategoryDialogData = inject(MAT_DIALOG_DATA);

  readonly categoryForm = this.fb.nonNullable.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data.category?.description ?? '']
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.categoryForm.valid) {
      const payload: CreateCategoryPayload = this.categoryForm.getRawValue();
      this.dialogRef.close(payload);
    }
  }
}
