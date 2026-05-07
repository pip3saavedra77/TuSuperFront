import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
    CustomTable,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {
  readonly store = inject(ModulesStore);
  private readonly dialog = inject(MatDialog);

  public readonly columns: TableColumn[] = [
    { label: 'ID', key: 'id' },
    { label: 'Nombre', key: 'name' },
    { label: 'Descripción', key: 'description' },
  ];

  openDialog(): void {
    this.dialog
      .open(ModulesForm, { width: '450px' })
      .afterClosed()
      .subscribe((result: ModuleModel | undefined) => {
        if (result) this.store.create(result);
      });
  }

  handleEdit(module: ModuleModel): void {
    this.dialog
      .open(ModulesForm, { width: '450px', data: module })
      .afterClosed()
      .subscribe((result: Partial<ModuleModel> | undefined) => {
        if (result && module.id) {
          this.store.update({ id: module.id, changes: result });
        }
      });
  }

  handleDelete(module: ModuleModel): void {
    if (!module.id) return;
    if (confirm(`¿Estás seguro de eliminar "${module.name}"?`)) {
      this.store.remove(module.id);
    }
  }
}
