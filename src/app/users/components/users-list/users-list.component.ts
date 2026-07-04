import { Component, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { skip } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { UsersStore } from '../../store/users.store';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';
import { AuthService } from '../../../core/services/auth';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent {
  readonly store = inject(UsersStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  readonly searchQuery = signal('');
  pageSize = 10;
  currentPage = 0;

  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.store.setSearch(query);
        this.store.loadAll();
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
    this.currentPage = event.pageIndex;
    this.store.setPage(event.pageSize, event.pageIndex * event.pageSize);
    this.store.loadAll();
  }

  openUserForm(user?: User): void {
    const roleClass = this.authService.isAdmin() ? 'profile-admin' : (this.authService.isTendero() ? 'profile-tendero' : 'profile-usuario');
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '480px',
      height: '100vh',
      position: { right: '0', top: '0' },
      panelClass: ['side-drawer-dialog', roleClass],
      data: { user },
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.store.loadAll();
      });
  }

  toggleStatus(user: User): void {
    this.store.toggleStatus(user.id);
  }

  retry(): void {
    this.store.clearError();
    this.store.loadAll();
  }

  getInitials(user: User): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }
}
