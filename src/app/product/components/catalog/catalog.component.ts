import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
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

  readonly searchQuery = signal<string>('');
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  constructor() {
    const debouncedSearch$ = toObservable(this.searchQuery).pipe(
      debounceTime(300),
      distinctUntilChanged(),
    );

    combineLatest([
      debouncedSearch$,
      toObservable(this.selectedCategoryId),
      toObservable(this.currentLimit),
      toObservable(this.currentOffset),
      this.reload$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([search, categoryId, limit, offset]) => {
        this.fetchProducts(search.trim(), categoryId, limit, offset);
      });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.reload$.next();
  }

  private fetchProducts(
    search: string,
    categoryId: number | null,
    limit: number,
    offset: number,
  ): void {
    this.loading.set(true);

    const filters: ProductFilterParams = {
      limit,
      offset,
    };

    if (search) {
      filters.search = search;
    }

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
    this.searchQuery.set(input.value);
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId);
    this.currentOffset.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
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
