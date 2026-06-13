import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModulesStore } from './store/modules.store';
import { ModulesForm } from './components/modules-form/modules-form';
import { ModuleModel } from './models/module.model';
import { CustomTable, TableColumn } from '../shared/components/custom-table/custom-table';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    CustomTable,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {
  readonly store = inject(ModulesStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  public readonly columns: TableColumn[] = [
    { label: 'ID', key: 'id' },
    { label: 'Nombre', key: 'name' },
    { label: 'Descripción', key: 'description' },
  ];

  openDialog(): void {
    this.dialog
      .open(ModulesForm, { width: '450px' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: ModuleModel | undefined) => {
        if (result) this.store.create(result);
      });
  }

  handleEdit(module: ModuleModel): void {
    this.dialog
      .open(ModulesForm, { width: '450px', data: module })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: Partial<ModuleModel> | undefined) => {
        if (result && module.id) {
          this.store.update({ id: module.id, changes: result });
        }
      });
  }

  handleDelete(module: ModuleModel): void {
    if (!module.id) return;
    const snackBarRef = this.snackBar.open(
      `Eliminar "${module.name}"?`, 'Confirmar',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      if (module.id) this.store.remove(module.id);
    });
  }
}
