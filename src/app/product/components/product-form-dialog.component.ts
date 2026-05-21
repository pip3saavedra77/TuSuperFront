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
import { MatIconModule } from '@angular/material/icon';

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
  barcode?: string;
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
    MatIconModule,
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
            <mat-label>Código de Barras</mat-label>
            <input matInput formControlName="barcode" placeholder="Ej: 7701234567890" />
            <mat-icon matSuffix>qr_code</mat-icon>
          </mat-form-field>

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

          <!-- CARGA DE IMAGEN -->
          <div class="image-upload-container">
            <label class="image-upload-label">Imagen del Producto</label>
            <div class="image-upload-dropzone" [class.has-file]="selectedFile() || data.product?.imageUrl" (click)="fileInput.click()">
              <input
                #fileInput
                type="file"
                accept="image/*"
                class="hidden-file-input"
                (change)="onFileSelected($event)" />

              @if (previewUrl()) {
                <div class="preview-wrapper">
                  <img [src]="previewUrl()" class="preview-img" alt="Vista previa de imagen" />
                  <button mat-icon-button type="button" class="remove-img-btn" (click)="removeSelectedFile($event)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              } @else if (data.product?.imageUrl) {
                <div class="preview-wrapper">
                  <img [src]="data.product!.imageUrl" class="preview-img" alt="Imagen actual" />
                  <button mat-icon-button type="button" class="remove-img-btn" (click)="removeSelectedFile($event)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              } @else {
                <div class="upload-placeholder">
                  <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  <span class="upload-text">Haz clic para subir imagen</span>
                  <span class="upload-hint">PNG, JPG hasta 5MB</span>
                </div>
              }
            </div>
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
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .image-upload-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .image-upload-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      background-color: #f8fafc;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
    }
    .image-upload-dropzone:hover {
      border-color: #2980B9;
      background-color: #f1f5f9;
    }
    .image-upload-dropzone.has-file {
      border-style: solid;
      border-color: #e2e8f0;
      padding: 8px;
      background-color: #ffffff;
    }
    .hidden-file-input {
      display: none;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #64748b;
    }
    .upload-placeholder .upload-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .upload-placeholder .upload-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
    }
    .upload-placeholder .upload-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .preview-wrapper {
      position: relative;
      width: 100%;
      max-width: 160px;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-img-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      background: rgba(15, 23, 42, 0.6) !important;
      color: #ffffff !important;
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .remove-img-btn mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      line-height: 14px;
    }
    .remove-img-btn:hover {
      background: rgba(15, 23, 42, 0.8) !important;
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

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  readonly form = this.fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0.01)]],
    stock:       [0, [Validators.required, Validators.min(0)]],
    categoryId:  [0, [Validators.required, Validators.min(1)]],
    providerId:  [0, [Validators.required, Validators.min(1)]],
    isActive:    [true],
    barcode:     [''],
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
        barcode: p.barcode ?? '',
      });
    } else if (this.data.barcode) {
      this.form.patchValue({
        barcode: this.data.barcode,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const file = this.selectedFile();

    if (this.isEditMode) {
      const payload: UpdateProductPayload = {
        ...raw,
        barcode: raw.barcode || null,
      };
      this.dialogRef.close({ payload, file });
    } else {
      const payload: CreateProductPayload = {
        name: raw.name,
        description: raw.description || undefined,
        price: raw.price,
        stock: raw.stock,
        isActive: raw.isActive,
        categoryId: raw.categoryId,
        providerId: raw.providerId,
        barcode: raw.barcode || null,
      };
      this.dialogRef.close({ payload, file });
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
