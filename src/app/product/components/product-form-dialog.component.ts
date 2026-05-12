import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductService } from '../services/product.service';
import {
  Product,
  Category,
  ProductProvider,
  CreateProductPayload,
  UpdateProductPayload,
} from '../../core/models/product.model';

export interface ProductFormDialogData {
  product?: Product;
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      {{ isEditMode ? 'Editar Producto' : 'Nuevo Producto' }}
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (loadingSelects()) {
        <div class="selects-loading">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Cargando datos...</span>
        </div>
      } @else {
        <form [formGroup]="form" class="product-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" placeholder="Ej: Leche entera 1L" />
            @if (form.controls.name.hasError('required')) {
              <mat-error>El nombre es obligatorio</mat-error>
            }
            @if (form.controls.name.hasError('maxlength')) {
              <mat-error>Máximo 255 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="description" rows="3"
                      placeholder="Descripción del producto (opcional)"></textarea>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Precio</mat-label>
              <input matInput type="number" formControlName="price" placeholder="0.00" />
              <span matTextPrefix>$&nbsp;</span>
              @if (form.controls.price.hasError('required')) {
                <mat-error>El precio es obligatorio</mat-error>
              }
              @if (form.controls.price.hasError('min')) {
                <mat-error>Debe ser mayor a 0</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Stock</mat-label>
              <input matInput type="number" formControlName="stock" placeholder="0" />
              @if (form.controls.stock.hasError('required')) {
                <mat-error>El stock es obligatorio</mat-error>
              }
              @if (form.controls.stock.hasError('min')) {
                <mat-error>No puede ser negativo</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Categoría</mat-label>
              <mat-select formControlName="categoryId">
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
              @if (form.controls.categoryId.hasError('required')) {
                <mat-error>Selecciona una categoría</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Proveedor</mat-label>
              <mat-select formControlName="providerId">
                @for (prov of providers(); track prov.id) {
                  <mat-option [value]="prov.id">{{ prov.name }}</mat-option>
                }
              </mat-select>
              @if (form.controls.providerId.hasError('required')) {
                <mat-error>Selecciona un proveedor</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-slide-toggle formControlName="isActive" color="primary">
            Producto activo
          </mat-slide-toggle>
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancelar</button>
      <button
        mat-flat-button
        class="save-btn"
        [disabled]="form.invalid || loadingSelects()"
        (click)="onSubmit()">
        {{ isEditMode ? 'Actualizar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      color: var(--color-text-primary, #111827);
      font-weight: 600;
    }
    .dialog-content {
      min-width: 480px;
      max-width: 560px;
    }
    .selects-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;
      color: var(--color-text-secondary, #6B7280);
      font-size: 0.875rem;
    }
    .product-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .full-width {
      width: 100%;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .half-width {
      flex: 1;
    }
    .cancel-btn {
      color: var(--color-text-secondary, #6B7280);
    }
    .save-btn {
      background: #2980B9;
      color: #FFFFFF;
    }
    .save-btn:hover:not(:disabled) {
      background: #2471A3;
    }
    .save-btn:disabled {
      opacity: 0.5;
    }
    mat-slide-toggle {
      margin-bottom: 8px;
    }
  `],
})
export class ProductFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialogComponent>);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data: ProductFormDialogData = inject(MAT_DIALOG_DATA);

  readonly categories = signal<Category[]>([]);
  readonly providers = signal<ProductProvider[]>([]);
  readonly loadingSelects = signal<boolean>(true);

  readonly isEditMode: boolean = !!this.data.product;

  readonly form = this.fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0.01)]],
    stock:       [0, [Validators.required, Validators.min(0)]],
    categoryId:  [0, [Validators.required, Validators.min(1)]],
    providerId:  [0, [Validators.required, Validators.min(1)]],
    isActive:    [true],
  });

  ngOnInit(): void {
    this.loadSelectData();

    if (this.data.product) {
      const p = this.data.product;
      this.form.patchValue({
        name: p.name,
        description: p.description ?? '',
        price: p.price,
        stock: p.stock,
        categoryId: p.category.id,
        providerId: p.provider.id,
        isActive: p.isActive,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    if (this.isEditMode) {
      const payload: UpdateProductPayload = { ...raw };
      this.dialogRef.close(payload);
    } else {
      const payload: CreateProductPayload = {
        name: raw.name,
        description: raw.description || undefined,
        price: raw.price,
        stock: raw.stock,
        isActive: raw.isActive,
        categoryId: raw.categoryId,
        providerId: raw.providerId,
      };
      this.dialogRef.close(payload);
    }
  }

  private loadSelectData(): void {
    forkJoin({
      categories: this.productService.getCategories(),
      providers: this.productService.getProviders(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.categories.set(result.categories.data);
          this.providers.set(result.providers.data);
          this.loadingSelects.set(false);
        },
        error: () => {
          this.loadingSelects.set(false);
        },
      });
  }
}
