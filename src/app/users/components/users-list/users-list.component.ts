import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { UsersService } from '../../services/users.service';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly totalUsers = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(0);
  readonly togglingUserId = signal<number | null>(null);

  pageSize = 10;

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(0);
        this.loadUsers();
      });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const params = {
      limit: this.pageSize,
      offset: this.currentPage() * this.pageSize,
      search: this.searchQuery().trim() || undefined
    };

    this.usersService.getUsers(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (result) => {
          this.users.set(result.data);
          this.totalUsers.set(result.total);
        },
        error: () => this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 })
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
    this.pageSize = event.pageSize;
    this.currentPage.set(event.pageIndex);
    this.loadUsers();
  }

  openUserForm(user?: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '480px',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: 'side-drawer-dialog',
      data: { user },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  toggleStatus(user: User): void {
    this.togglingUserId.set(user.id);
    this.usersService.toggleStatus(user.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.togglingUserId.set(null))
      )
      .subscribe({
        next: () => {
          this.users.update(list =>
            list.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u)
          );
          const updated = this.users().find(u => u.id === user.id);
          this.snackBar.open(
            `Usuario ${updated?.isActive ? 'activado' : 'desactivado'}`,
            'Cerrar',
            { duration: 2000 }
          );
        },
        error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 })
      });
  }

  getInitials(user: User): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }
}
