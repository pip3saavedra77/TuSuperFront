import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { UsersService } from '../../services/users.service';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  users: User[] = [];
  totalUsers = 0;
  pageSize = 10;
  currentPage = 0;
  isLoading = false;
  searchControl = new FormControl('');

  displayedColumns: string[] = ['avatar', 'fullName', 'email', 'roles', 'status', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
    this.setupSearch();
  }

  loadUsers(): void {
    this.isLoading = true;
    const params = {
      limit: this.pageSize,
      offset: this.currentPage * this.pageSize,
      search: this.searchControl.value || undefined
    };

    this.usersService.getUsers(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (result) => {
          this.users = result.data;
          this.totalUsers = result.total;
          this.cdr.detectChanges();
        },
        error: () => this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 })
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.loadUsers();
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadUsers();
  }

  openUserForm(user?: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '600px',
      data: { user },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  toggleStatus(user: User): void {
    this.usersService.toggleStatus(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.snackBar.open(`Usuario ${user.isActive ? 'activado' : 'desactivado'}`, 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 3000 })
    });
  }

  getInitials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
}
