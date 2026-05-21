import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, of, switchMap } from 'rxjs';
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

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // ── State (Signals) ──────────────────────────────────
  readonly products = signal<ProductModel[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);
  readonly isSearching = signal<boolean>(false);

  // ── Drawer & Form State ─────────────────────────────
  readonly drawerOpen = signal<boolean>(false);
  readonly editingProduct = signal<ProductModel | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly providers = signal<ProductProvider[]>([]);
  readonly loadingFormSelects = signal<boolean>(false);
  readonly selectedCategoryId = signal<number | 'todos'>('todos');

  // ── Search ───────────────────────────────────────────
  readonly searchQuery = signal<string>('');

  // ── Image Upload State ───────────────────────────────
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

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
    barcode:     [''],
  });

  constructor() {}

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

  clearSearch(input?: HTMLInputElement): void {
    this.searchQuery.set('');
    if (input) {
      input.value = '';
    }
    this.currentOffset.set(0);
    this.loadProducts();
    this.focusSearchInput();
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

  onAdd(prefill?: { barcode?: string; name?: string }): void {
    this.editingProduct.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.form.reset({
      name: prefill?.name || '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: 0,
      providerId: 0,
      isActive: true,
      barcode: prefill?.barcode || '',
    });
    this.drawerOpen.set(true);
  }

  onEdit(product: ProductModel): void {
    this.editingProduct.set(product);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.form.setValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stock,
      categoryId: product.category.id,
      providerId: product.provider.id,
      isActive: product.isActive,
      barcode: product.barcode ?? '',
    });
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingProduct.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.form.reset();
    this.focusSearchInput();
  }

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

  onSmartSearch(query: string): void {
    const cleaned = query.trim();
    if (!cleaned) {
      this.clearSearch();
      return;
    }

    this.isSearching.set(true);

    const isCodeLike = !cleaned.includes(' ') && (/^\d+$/.test(cleaned) || /^[a-zA-Z0-9-]{5,50}$/.test(cleaned));

    if (isCodeLike) {
      this.productService
        .getProductByBarcode(cleaned)
        .pipe(
          finalize(() => {
            this.isSearching.set(false);
            this.focusSearchInput();
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (product) => {
            this.products.set([product]);
            this.totalProducts.set(1);
            this.searchQuery.set(cleaned);
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 404) {
              this.snackBar.open('Código de barras no registrado. Abriendo formulario...', 'Cerrar', {
                duration: 3000,
              });
              this.onAdd({ barcode: cleaned });
            } else {
              this.performNameSearch(cleaned);
            }
          },
        });
    } else {
      this.performNameSearch(cleaned);
    }
  }

  private performNameSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentOffset.set(0);
    this.loading.set(true);

    const filters: ProductFilterParams = {
      limit: this.currentLimit(),
      offset: 0,
      search: query,
    };

    const catId = this.selectedCategoryId();
    if (catId !== 'todos') {
      filters.categoryId = catId;
    }

    this.productService
      .getAll(filters)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.isSearching.set(false);
          this.focusSearchInput();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.data);
          this.totalProducts.set(result.total);
          if (result.data.length === 0) {
            this.snackBar.open('Sin coincidencias. Abriendo formulario...', 'Cerrar', {
              duration: 3000,
            });
            this.onAdd({ name: query });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private focusSearchInput(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  submitForm(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const editing = this.editingProduct();

    if (editing) {
      const payload: UpdateProductPayload = {
        ...raw,
        barcode: raw.barcode || null,
      };
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
        barcode: raw.barcode || null,
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
        switchMap((product) => {
          const file = this.selectedFile();
          if (file) {
            return this.productService.uploadProductImage(product.id, file);
          }
          return of(product);
        }),
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
        switchMap((product) => {
          const file = this.selectedFile();
          if (file) {
            return this.productService.uploadProductImage(product.id, file);
          }
          return of(product);
        }),
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
