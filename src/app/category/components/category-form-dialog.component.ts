import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

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

    MatButtonModule,

    MatIconModule

  ],

  template: `

    <form [formGroup]="categoryForm" (ngSubmit)="onSave()" class="form-dialog">

      <header class="form-dialog__header">

        <div class="form-dialog__icon">

          <mat-icon>category</mat-icon>

        </div>

        <div class="form-dialog__heading">

          <h2 class="form-dialog__title">{{ data.category ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>

          <p class="form-dialog__subtitle">

            {{ data.category ? 'Actualiza los datos de esta categoría.' : 'Crea una categoría para organizar tus productos.' }}

          </p>

        </div>

        <button mat-icon-button type="button" class="form-dialog__close" (click)="onCancel()" aria-label="Cerrar">

          <mat-icon>close</mat-icon>

        </button>

      </header>



      <mat-dialog-content class="form-dialog__body">

        <mat-form-field appearance="outline" class="full-width">

          <mat-label>Nombre</mat-label>

          <input matInput formControlName="name" placeholder="Ej: Lácteos" maxlength="100">

          <mat-icon matSuffix>label</mat-icon>

          <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">

            El nombre es obligatorio

          </mat-error>

        </mat-form-field>



        <mat-form-field appearance="outline" class="full-width">

          <mat-label>Descripción</mat-label>

          <textarea matInput formControlName="description" rows="3" placeholder="Breve descripción (opcional)"></textarea>

        </mat-form-field>

      </mat-dialog-content>



      <mat-dialog-actions class="form-dialog__actions">

        <button mat-button type="button" class="form-dialog__btn-cancel" (click)="onCancel()">Cancelar</button>

        <button mat-flat-button

                type="submit"

                class="form-dialog__btn-submit"

                [disabled]="categoryForm.invalid">

          {{ data.category ? 'Actualizar' : 'Crear categoría' }}

        </button>

      </mat-dialog-actions>

    </form>

  `,

  styles: [`

    :host ::ng-deep .form-dialog .full-width { width: 100%; }

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

