import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  AfterViewInit,
  ViewChild,
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

import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import {
  Product,
  Category,
  ProductFilterParams,
} from '../../../core/models/product.model';
import { CartStore } from '../../store/cart.store';
import { CartPanelComponent } from '../cart-panel/cart-panel.component';
import { PageHeader } from '../../../shared/components/page-header/page-header';

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
    PageHeader,
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput', { read: ElementRef }) searchInputRef?: ElementRef<HTMLInputElement>;
  private readonly productService = inject(ProductService);
  readonly cartStore = inject(CartStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

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
    this.loadCategories();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params.get('cart') === 'open') {
        this.cartStore.openCart();
      } else {
        this.cartStore.closeCart();
      }
      const categoryParam = params.get('category');
      if (categoryParam) {
        this.selectedCategoryId.set(Number(categoryParam));
        this.currentOffset.set(0);
      }
    });
  }

  ngAfterViewInit(): void {
    const focusParam = this.route.snapshot.queryParamMap.get('focus');
    if (focusParam === 'search' && this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
    }
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
    this.cartStore.openCart();
    this.snackBar.open(
      `${product.name} agregado al carrito`,
      'Cerrar',
      { duration: 2000, panelClass: ['success-snackbar'] },
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
    this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
