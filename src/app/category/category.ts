import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  DestroyRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { CategoryService } from './services/category.service';
import { 
  Category as CategoryModel, 
  CategoryWithProducts, 
  CreateCategoryPayload, 
  UpdateCategoryPayload 
} from '../core/models/category.model';
import { CategoryFormDialogComponent } from './components/category-form-dialog.component';
import { 
  ConfirmDeleteDialogComponent, 
  ConfirmDeleteDialogData 
} from '../product/components/confirm-delete-dialog.component';

import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class CategoryComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ── State (Signals) ──────────────────────────────────
  readonly categories = signal<CategoryWithProducts[]>([]);
  readonly totalCategories = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Search ───────────────────────────────────────────
  readonly searchQuery = signal<string>('');

  // ── Table config ─────────────────────────────────────
  readonly displayedColumns: string[] = ['id', 'name', 'description', 'actions'];

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentOffset.set(0);
        this.loadCategories();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    this.categoryService
      .getAll({
        limit: this.currentLimit(),
        offset: this.currentOffset(),
        search: this.searchQuery().trim() || undefined,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.categories.set(result.data);
          this.totalCategories.set(result.total);
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadCategories();
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '450px',
      data: {},
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: CreateCategoryPayload | undefined) => {
        if (payload) this.createCategory(payload);
      });
  }

  onEdit(category: CategoryModel): void {
    const dialogRef = this.dialog.open(CategoryFormDialogComponent, {
      width: '450px',
      data: { category },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: UpdateCategoryPayload | undefined) => {
        if (payload) this.updateCategory(category.id, payload);
      });
  }

  onDelete(category: CategoryWithProducts): void {
    const dialogData: ConfirmDeleteDialogData = {
      productName: category.name, // Mapeado para reusar ConfirmDeleteDialog
    };

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (confirmed) this.deleteCategory(category.id);
      });
  }

  private createCategory(payload: CreateCategoryPayload): void {
    this.loading.set(true);
    this.categoryService
      .create(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Categoría creada', 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private updateCategory(id: number, payload: UpdateCategoryPayload): void {
    this.loading.set(true);
    this.categoryService
      .update(id, payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private deleteCategory(id: number): void {
    this.loading.set(true);
    this.categoryService
      .delete(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private showError(err: HttpErrorResponse): void {
    const message = (err.error as { message?: string })?.message || 'Error en la operación';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
