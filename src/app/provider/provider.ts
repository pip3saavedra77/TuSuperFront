import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  DestroyRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

import { ProviderService } from './services/provider.service';
import { 
  Provider as ProviderModel, 
  ProviderWithProducts, 
  CreateProviderPayload, 
  UpdateProviderPayload 
} from '../core/models/provider.model';
import { ProviderFormDialogComponent } from './components/provider-form-dialog.component';
import { 
  ConfirmDeleteDialogComponent, 
  ConfirmDeleteDialogData 
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
  ],
  templateUrl: './provider.html',
  styleUrl: './provider.scss',
})
export class ProviderComponent implements OnInit {
  private readonly providerService = inject(ProviderService);
  public readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ── State (Signals) ──────────────────────────────────
  readonly providers = signal<ProviderWithProducts[]>([]);
  readonly totalProviders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly currentLimit = signal<number>(10);
  readonly currentOffset = signal<number>(0);

  // ── Search ───────────────────────────────────────────
  searchTerm = '';
  private readonly searchSubject = new Subject<string>();

  // ── Table config ─────────────────────────────────────
  readonly displayedColumns: string[] = ['id', 'name', 'phone', 'email', 'actions'];

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentOffset.set(0);
        this.loadProviders();
      });
  }

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading.set(true);

    this.providerService
      .getAll({
        limit: this.currentLimit(),
        offset: this.currentOffset(),
        search: this.searchTerm.trim() || undefined,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.providers.set(result.data);
          this.totalProviders.set(result.total);
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: PageEvent): void {
    this.currentLimit.set(event.pageSize);
    this.currentOffset.set(event.pageIndex * event.pageSize);
    this.loadProviders();
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
        if (payload) this.createProvider(payload);
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
        if (payload) this.updateProvider(provider.id, payload);
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
        if (confirmed) this.deleteProvider(provider.id);
      });
  }

  private createProvider(payload: CreateProviderPayload): void {
    this.loading.set(true);
    this.providerService
      .create(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Proveedor creado', 'Cerrar', { duration: 3000 });
          this.loadProviders();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private updateProvider(id: number, payload: UpdateProviderPayload): void {
    this.loading.set(true);
    this.providerService
      .update(id, payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Proveedor actualizado', 'Cerrar', { duration: 3000 });
          this.loadProviders();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private deleteProvider(id: number): void {
    this.loading.set(true);
    this.providerService
      .delete(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Proveedor eliminado', 'Cerrar', { duration: 3000 });
          this.loadProviders();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  private showError(err: HttpErrorResponse): void {
    const message = (err.error as { message?: string })?.message || 'Error en la operación';
    this.snackBar.open(message, 'Cerrar', { duration: 5000 });
  }
}
