import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

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

import { ProviderStore } from './store/provider.store';
import {
  Provider as ProviderModel,
  ProviderWithProducts,
  CreateProviderPayload,
  UpdateProviderPayload,
} from '../core/models/provider.model';
import { ProviderFormDialogComponent } from './components/provider-form-dialog.component';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
} from '../product/components/confirm-delete-dialog.component';

import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-provider',
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
  templateUrl: './provider.html',
  styleUrl: './provider.scss',
})
export class ProviderComponent implements OnInit {
  readonly store = inject(ProviderStore);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns: string[] = ['id', 'name', 'phone', 'email', 'actions'];

  readonly searchQuery = signal('');

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.store.setSearch(query);
        this.store.loadAll({
          limit: this.store.limit(),
          offset: 0,
          search: query || undefined,
        });
      });
  }

  ngOnInit(): void {
    this.store.loadAll({ limit: this.store.limit(), offset: this.store.offset() });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageSize, event.pageIndex * event.pageSize);
    this.store.loadAll({
      limit: event.pageSize,
      offset: event.pageIndex * event.pageSize,
      search: this.searchQuery().trim() || undefined,
    });
  }

  onAdd(): void {
    const dialogRef = this.dialog.open(ProviderFormDialogComponent, {
      width: '450px',
      data: {},
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: CreateProviderPayload | undefined) => {
        if (payload) {
          this.store.create(payload);
          this.snackBar.open('Proveedor creado', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onEdit(provider: ProviderModel): void {
    const dialogRef = this.dialog.open(ProviderFormDialogComponent, {
      width: '450px',
      data: { provider },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload: UpdateProviderPayload | undefined) => {
        if (payload) {
          this.store.update({ id: provider.id, changes: payload });
          this.snackBar.open('Proveedor actualizado', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onDelete(provider: ProviderWithProducts): void {
    const dialogData: ConfirmDeleteDialogData = {
      productName: provider.name,
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
          this.store.remove(provider.id);
          this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
        }
      });
  }
}
