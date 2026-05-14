import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
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

import { ProductService } from './services/product.service';
import {
  Product as ProductModel,
  ProductFilterParams,
  CreateProductPayload,
  UpdateProductPayload,
} from '../core/models/product.model';
import {
  ProductFormDialogComponent,
  ProductFormDialogData,
} from './components/product-form-dialog.component';
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
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss',
})
export class Product implements OnInit {
  // Note: class name kept as 'Product' to match app.routes.ts lazy-load
  // The interface is aliased as ProductModel to avoid conflict
  private readonly productService = inject(ProductService);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ── State (Signals) ──────────────────────────────────
  readonly products = signal<ProductModel[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Search ───────────────────────────────────────────
  searchTerm = '';
  private readonly searchSubject = new Subject<string>();

  // ── Table config ─────────────────────────────────────
  readonly displayedColumns: string[] = [
    'image',
    'name',
    'price',
    'stock',
    'category',
    'actions',
  ];

  constructor() {
    this.searchSubject
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
  }

  // ── Data loading ─────────────────────────────────────

  loadProducts(): void {
    this.loading.set(true);

    const filters: ProductFilterParams = {
      limit: this.currentLimit(),
      offset: this.currentOffset(),
    };

    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
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

  // ── Event handlers ───────────────────────────────────

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadProducts();
  }

  onAdd(): void {
    const dialogData: ProductFormDialogData = {};

    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: CreateProductPayload | undefined) => {
        if (payload) {
          this.createProduct(payload);
        }
      });
  }

  onEdit(product: ProductModel): void {
    const dialogData: ProductFormDialogData = { product };

    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: UpdateProductPayload | undefined) => {
        if (payload) {
          this.updateProduct(product.id, payload);
        }
      });
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
