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

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProductService } from '../../services/product.service';
import {
  Product,
  Category,
  ProductFilterParams,
} from '../../../core/models/product.model';
import { CartStore } from '../../store/cart.store';
import { CartPanelComponent } from '../cart-panel/cart-panel.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CartPanelComponent,
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly cartStore = inject(CartStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = signal<Product[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly categories = signal<Category[]>([]);
  readonly currentLimit = signal<number>(12);
  readonly currentOffset = signal<number>(0);
  readonly selectedCategoryId = signal<number | null>(null);

  searchTerm = '';
  private readonly searchSubject = new Subject<string>();

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
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading.set(true);

    const filters: ProductFilterParams = {
      limit: this.currentLimit(),
      offset: this.currentOffset(),
    };

    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    const categoryId = this.selectedCategoryId();
    if (categoryId !== null) {
      filters.categoryId = categoryId;
    }

    this.productService
      .getAll(filters)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: result => {
          this.products.set(result.data);
          this.totalProducts.set(result.total);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.currentOffset.set(0);
    this.loadProducts();
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadProducts();
  }

  onAddToCart(product: Product): void {
    this.cartStore.addItem(product);
    this.snackBar.open(
      `${product.name} agregado al carrito`,
      'OK',
      { duration: 2000 },
    );
  }

  toggleCart(): void {
    this.cartStore.toggleCart();
  }

  onCartOpenedChange(isOpen: boolean): void {
    if (!isOpen && this.cartStore.isOpen()) {
      this.cartStore.closeCart();
    }
  }

  private loadCategories(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.categories.set(result.data);
        },
        error: (err: HttpErrorResponse) => {
          this.showError(err);
        },
      });
  }

  private showError(err: HttpErrorResponse): void {
    const message =
      (err.error as { message?: string })?.message ??
      'Error al procesar la solicitud';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
