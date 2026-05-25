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

    <div class="form-dialog form-dialog--wide">

      <header class="form-dialog__header">

        <div class="form-dialog__icon">

          <mat-icon>inventory_2</mat-icon>

        </div>

        <div class="form-dialog__heading">

          <h2 class="form-dialog__title">{{ isEditMode ? 'Editar Producto' : 'Nuevo Producto' }}</h2>

          <p class="form-dialog__subtitle">

            {{ isEditMode ? 'Actualiza la información de este producto.' : 'Agrega un producto a tu inventario.' }}

          </p>

        </div>

        <button mat-icon-button type="button" class="form-dialog__close" mat-dialog-close aria-label="Cerrar">

          <mat-icon>close</mat-icon>

        </button>

      </header>



      <mat-dialog-content class="form-dialog__body">

        @if (loadingSelects()) {

          <div class="selects-loading">

            <mat-spinner diameter="32"></mat-spinner>

            <span>Cargando datos...</span>

          </div>

        } @else {

          <form [formGroup]="form" class="product-form">



            <!-- Sección: Identificación -->

            <section class="form-section">

              <div class="form-section__label">

                <mat-icon>qr_code_2</mat-icon>

                <span>Identificación</span>

              </div>

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">

                <mat-label>Código de Barras</mat-label>

                <input matInput formControlName="barcode" placeholder="Ej: 7701234567890" />

                <mat-icon matSuffix>qr_code</mat-icon>

                <mat-hint>Opcional · útil para escaneo en POS</mat-hint>

              </mat-form-field>



              <mat-form-field appearance="outline" class="full-width">

                <mat-label>Nombre del producto</mat-label>

                <input matInput formControlName="name" placeholder="Ej: Leche entera 1L" />

                <mat-icon matSuffix>label</mat-icon>

                @if (form.controls.name.hasError('required')) {

                  <mat-error>El nombre es obligatorio</mat-error>

                }

                @if (form.controls.name.hasError('maxlength')) {

                  <mat-error>Máximo 255 caracteres</mat-error>

                }

              </mat-form-field>



              <mat-form-field appearance="outline" class="full-width">

                <mat-label>Descripción</mat-label>

                <textarea matInput formControlName="description" rows="2"

                          placeholder="Detalles, presentación, sabor, etc. (opcional)"></textarea>

              </mat-form-field>

            </section>



            <!-- Sección: Precio e inventario -->

            <section class="form-section">

              <div class="form-section__label">

                <mat-icon>payments</mat-icon>

                <span>Precio e inventario</span>

              </div>

              <div class="form-dialog__row">

                <mat-form-field appearance="outline">

                  <mat-label>Precio</mat-label>

                  <input matInput type="number" formControlName="price" placeholder="0.00" />

                  <span matTextPrefix>$&nbsp;</span>

                  @if (form.controls.price.hasError('required')) {

                    <mat-error>Requerido</mat-error>

                  }

                  @if (form.controls.price.hasError('min')) {

                    <mat-error>Debe ser mayor a 0</mat-error>

                  }

                </mat-form-field>



                <mat-form-field appearance="outline">

                  <mat-label>Stock disponible</mat-label>

                  <input matInput type="number" formControlName="stock" placeholder="0" />

                  <mat-icon matSuffix>inventory</mat-icon>

                  @if (form.controls.stock.hasError('required')) {

                    <mat-error>Requerido</mat-error>

                  }

                  @if (form.controls.stock.hasError('min')) {

                    <mat-error>No puede ser negativo</mat-error>

                  }

                </mat-form-field>

              </div>

            </section>



            <!-- Sección: Clasificación -->

            <section class="form-section">

              <div class="form-section__label">

                <mat-icon>category</mat-icon>

                <span>Clasificación</span>

              </div>

              <div class="form-dialog__row">

                <mat-form-field appearance="outline">

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



                <mat-form-field appearance="outline">

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

            </section>



            <!-- Sección: Imagen + estado -->

            <section class="form-section">

              <div class="form-section__label">

                <mat-icon>image</mat-icon>

                <span>Imagen y visibilidad</span>

              </div>



              <div class="image-upload-container">

                <div class="image-upload-dropzone"

                     [class.has-file]="selectedFile() || data.product?.imageUrl"

                     (click)="fileInput.click()">

                  <input #fileInput type="file" accept="image/*" class="hidden-file-input"

                         (change)="onFileSelected($event)" />



                  @if (previewUrl()) {

                    <div class="preview-wrapper">

                      <img [src]="previewUrl()" class="preview-img" alt="Vista previa" />

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

                      <span class="upload-text">Haz clic para subir una imagen</span>

                      <span class="upload-hint">PNG, JPG hasta 5MB</span>

                    </div>

                  }

                </div>

              </div>



              <div class="toggle-row">

                <mat-slide-toggle formControlName="isActive" color="primary">

                  <span class="toggle-label">Producto activo</span>

                  <span class="toggle-hint">Visible para los clientes en el catálogo</span>

                </mat-slide-toggle>

              </div>

            </section>

          </form>

        }

      </mat-dialog-content>



      <mat-dialog-actions class="form-dialog__actions">

        <button mat-button mat-dialog-close class="form-dialog__btn-cancel">Cancelar</button>

        <button mat-flat-button

                class="form-dialog__btn-submit"

                [disabled]="form.invalid || loadingSelects()"

                (click)="onSubmit()">

          <mat-icon>{{ isEditMode ? 'save' : 'add' }}</mat-icon>

          {{ isEditMode ? 'Actualizar' : 'Crear producto' }}

        </button>

      </mat-dialog-actions>

    </div>

  `,

  styles: [`

    :host ::ng-deep .form-dialog .full-width { width: 100%; }

    :host ::ng-deep .form-dialog--wide { min-width: 560px; max-width: 640px; }

    .selects-loading {

      display: flex; align-items: center; justify-content: center;

      gap: 12px; padding: 48px 16px;

      color: #64748b; font-size: 0.875rem;

    }

    .product-form { display: flex; flex-direction: column; gap: 20px; }

    .form-section {

      display: flex; flex-direction: column; gap: 12px;

      padding-bottom: 18px;

      border-bottom: 1px dashed rgba(15, 23, 42, 0.08);

    }

    .form-section:last-of-type { border-bottom: none; padding-bottom: 0; }

    .form-section__label {

      display: flex; align-items: center; gap: 8px;

      font-size: 0.72rem; font-weight: 800;

      text-transform: uppercase; letter-spacing: 0.08em;

      color: #64748b; margin-bottom: 2px;

    }

    .form-section__label mat-icon {

      font-size: 18px; width: 18px; height: 18px;

      color: var(--profile-primary, #2980B9);

    }

    .image-upload-container { display: flex; flex-direction: column; gap: 6px; }

    .image-upload-dropzone {

      border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px;

      text-align: center; cursor: pointer;

      background: #f8fafc;

      transition: border-color 0.2s ease, background 0.2s ease;

      display: flex; justify-content: center; align-items: center;

      min-height: 110px;

    }

    .image-upload-dropzone:hover {

      border-color: var(--profile-primary, #2980B9);

      background: #f1f5f9;

    }

    .image-upload-dropzone.has-file {

      border-style: solid; border-color: #e2e8f0;

      padding: 8px; background: #ffffff;

    }

    .hidden-file-input { display: none; }

    .upload-placeholder {

      display: flex; flex-direction: column; align-items: center;

      gap: 4px; color: #64748b;

    }

    .upload-placeholder .upload-icon {

      font-size: 32px; width: 32px; height: 32px;

      color: #94a3b8; margin-bottom: 4px;

    }

    .upload-placeholder .upload-text {

      font-size: 0.9rem; font-weight: 600; color: #334155;

    }

    .upload-placeholder .upload-hint {

      font-size: 0.75rem; color: #94a3b8;

    }

    .preview-wrapper {

      position: relative; width: 100%; max-width: 180px; height: 130px;

      border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;

      display: flex; justify-content: center; align-items: center;

    }

    .preview-img { width: 100%; height: 100%; object-fit: cover; }

    .remove-img-btn {

      position: absolute; top: 4px; right: 4px;

      background: rgba(15, 23, 42, 0.7) !important;

      color: #fff !important;

      width: 26px !important; height: 26px !important;

      line-height: 26px !important;

      display: flex !important; align-items: center !important; justify-content: center !important;

    }

    .remove-img-btn mat-icon {

      font-size: 14px; width: 14px; height: 14px; line-height: 14px;

    }

    .remove-img-btn:hover { background: rgba(15, 23, 42, 0.85) !important; }

    .toggle-row {

      display: flex; align-items: center;

      padding: 10px 12px;

      background: #f8fafc;

      border: 1px solid rgba(15, 23, 42, 0.06);

      border-radius: 10px;

    }

    .toggle-label {

      display: block; font-weight: 600; color: #0f172a;

      font-size: 0.875rem;

    }

    .toggle-hint {

      display: block; font-size: 0.75rem; color: #64748b;

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

