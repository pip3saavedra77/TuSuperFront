import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { CategoryStore } from './store/category.store';
import {
  Category as CategoryModel,
  CategoryWithProducts,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../core/models/category.model';
import { CategoryFormDialogComponent } from './components/category-form-dialog.component';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
} from '../product/components/confirm-delete-dialog.component';
import { useListSearch } from '../shared/helpers/list-search.helper';

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
  readonly store = inject(CategoryStore);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns: string[] = ['id', 'name', 'description', 'products', 'actions'];
  readonly list = useListSearch(this.store);

  ngOnInit(): void {
    this.store.loadAll({ limit: this.store.limit(), offset: this.store.offset() });
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
        if (payload) {
          this.store.create(payload);
          this.snackBar.open('Categoria creada', 'Cerrar', { duration: 3000 });
        }
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
        if (payload) {
          this.store.update({ id: category.id, changes: payload });
          this.snackBar.open('Categoria actualizada', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onDelete(category: CategoryWithProducts): void {
    const dialogData: ConfirmDeleteDialogData = {
      productName: category.name,
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
          this.store.remove(category.id);
          this.snackBar.open('Categoria eliminada', 'Cerrar', { duration: 3000 });
        }
      });
  }
}
