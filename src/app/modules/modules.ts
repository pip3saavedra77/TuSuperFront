import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModulesService } from './services/modules';
import { ModulesForm } from './components/modules-form/modules-form';
import { ModuleModel } from './models/module.model';
import { CustomTable, TableColumn } from '../shared/components/custom-table/custom-table';

@Component({
  selector: 'app-modules',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    CustomTable,
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {

  private readonly moduleService = inject(ModulesService);
  private readonly dialog = inject(MatDialog);

  public columns: TableColumn[] = [
    { label: 'ID', key: 'id' },
    { label: 'Nombre', key: 'name' },
    { label: 'Descripción', key: 'description' },
  ];

  public modules = this.moduleService.modules;

  openDialog(): void {
    const dialogRef = this.dialog.open(ModulesForm, { width: '450px' });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.moduleService.createModule(result).subscribe({
        error: () => alert('Error al crear el módulo'),
      });
    });
  }

  handleEdit(module: ModuleModel): void {
    const dialogRef = this.dialog.open(ModulesForm, {
      width: '450px',
      data: module,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result || !module.id) return;
      this.moduleService.updateModule(module.id, result).subscribe({
        error: () => alert('Error al actualizar el módulo'),
      });
    });
  }

  handleDelete(module: ModuleModel): void {
    if (!module.id) return;
    const confirmed = confirm(`¿Estás seguro de eliminar "${module.name}"?`);
    if (!confirmed) return;

    this.moduleService.delete(module.id).subscribe({
      error: () => alert('Error al eliminar el módulo'),
    });
  }
}
