import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ProductService } from './services/product.service';
import {
  Product as ProductModel,
  ProductFilterParams,
  CreateProductPayload,
  UpdateProductPayload,
  Category,
  ProductProvider,
} from '../core/models/product.model';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
} from './components/confirm-delete-dialog.component';

import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  private readonly productService = inject(ProductService);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  // ── State (Signals) ──────────────────────────────────
  readonly products = signal<ProductModel[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Drawer & Form State ─────────────────────────────
  readonly drawerOpen = signal<boolean>(false);
  readonly editingProduct = signal<ProductModel | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly providers = signal<ProductProvider[]>([]);
  readonly loadingFormSelects = signal<boolean>(false);
  readonly selectedCategoryId = signal<number | 'todos'>('todos');

  // ── Search ───────────────────────────────────────────
  readonly searchQuery = signal<string>('');

  // ── Table config ─────────────────────────────────────
  readonly displayedColumns: string[] = [
    'image',
    'name',
    'price',
    'stock',
    'category',
    'actions',
  ];

  // Formulario reactivo tipado estrictamente
  readonly form = this.fb.nonNullable.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    price:       [0, [Validators.required, Validators.min(0.01)]],
    stock:       [0, [Validators.required, Validators.min(0)]],
    categoryId:  [0, [Validators.required, Validators.min(1)]],
    providerId:  [0, [Validators.required, Validators.min(1)]],
    isActive:    [true],
  });

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentOffset.set(0);
        this.loadProducts();
      });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadSelectData();
  }

  // ── Data loading ─────────────────────────────────────

  loadProducts(): void {
    this.loading.set(true);

    const filters: ProductFilterParams = {
      limit: this.currentLimit(),
      offset: this.currentOffset(),
    };

    const query = this.searchQuery().trim();
    if (query) {
      filters.search = query;
    }

    const catId = this.selectedCategoryId();
    if (catId !== 'todos') {
      filters.categoryId = catId;
    }

    this.productService
      .getAll(filters)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.data);
          this.totalProducts.set(result.total);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private loadSelectData(): void {
    this.loadingFormSelects.set(true);
    forkJoin({
      categories: this.productService.getCategories(),
      providers: this.productService.getProviders(),
    })
      .pipe(
        finalize(() => this.loadingFormSelects.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.categories.set(result.categories.data);
          this.providers.set(result.providers.data);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  // ── Event handlers ───────────────────────────────────

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onCategoryChange(value: number | 'todos'): void {
    this.selectedCategoryId.set(value || 'todos');
    this.currentOffset.set(0);
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadProducts();
  }

  onAdd(): void {
    this.editingProduct.set(null);
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: 0,
      providerId: 0,
      isActive: true,
    });
    this.drawerOpen.set(true);
  }

  onEdit(product: ProductModel): void {
    this.editingProduct.set(product);
    this.form.setValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category.id,
      providerId: product.provider.id,
      isActive: product.isActive,
    });
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingProduct.set(null);
    this.form.reset();
  }

  submitForm(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const editing = this.editingProduct();

    if (editing) {
      const payload: UpdateProductPayload = { ...raw };
      this.updateProduct(editing.id, payload);
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
      this.createProduct(payload);
    }
  }

  onDelete(product: ProductModel): void {
    const dialogData: ConfirmDeleteDialogData = {
      productName: product.name,
    };

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) {
          this.deleteProduct(product.id);
        }
      });
  }

  // ── CRUD operations ──────────────────────────────────

  private createProduct(payload: CreateProductPayload): void {
    this.loading.set(true);

    this.productService
      .create(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Producto creado exitosamente', 'Cerrar', {
            duration: 3000,
          });
          this.closeDrawer();
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private updateProduct(id: number, payload: UpdateProductPayload): void {
    this.loading.set(true);

    this.productService
      .update(id, payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
            duration: 3000,
          });
          this.closeDrawer();
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private deleteProduct(id: number): void {
    this.loading.set(true);

    this.productService
      .delete(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Producto eliminado exitosamente', 'Cerrar', {
            duration: 3000,
          });
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  // ── Error handling ───────────────────────────────────

  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
