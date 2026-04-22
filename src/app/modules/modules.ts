import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ModulesService } from './services/modules';
import { ModulesForm } from './components/modules-form/modules-form';
import { ModuleModel } from './models/module.model';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomTable, TableColumn } from '../shared/components/custom-table/custom-table';

@Component({
  selector: 'app-modules',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    CustomTable
  ],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class Modules {

  private moduleService = inject(ModulesService)

  public columns: TableColumn[] = [
    { label: 'ID', key: 'id' },
    { label: 'Nombre', key: 'name' },
    { label: 'Descripción', key: 'description' }
  ];

  // Obtenemos la señal del servicio (es readonly)
  public modules = this.moduleService.modules;

  constructor(private dialog: MatDialog) { }

  openDialog() {
    const dialogRef = this.dialog.open(ModulesForm, { width: '450px' });

    dialogRef.afterClosed().subscribe(result => {
      // Si el usuario no canceló (result existe)
      if (result) {
        // AQUÍ es donde llamas al servicio
        this.moduleService.createModule(result).subscribe({
          next: (response: ModuleModel) => {
            console.log('¡Guardado con éxito!', response);
            // Al usar Signals en el servicio, tu lista se actualizará sola
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error al guardar', err);
            // Aquí podrías mostrar una alerta de error
          }
        });
      }
    });
  }

  // handleEdit(module: ModuleModel) {
  //   console.log('Editando al usuario:', module);
  //   // Aquí podrías abrir un diálogo de Angular Material con el formulario
  //   // this.dialog.open(UserFormComponent, { data: user });
  // }

  handleEdit(module: ModuleModel) {
    const dialogRef = this.dialog.open(ModulesForm, {
      width: '450px',
      data: module // <-- Pasamos el objeto completo al diálogo
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && module.id) {
        // Llamamos a un método de actualización en tu servicio
        this.moduleService.updateModule(module.id, result).subscribe({
          next: (response) => {
            console.log('Actualizado con éxito', response);
          },
          error: (err) => console.error('Error al actualizar', err)
        });
      }
    });
  }

  handleDelete(module: ModuleModel) {
    const confirmacion = confirm(`¿Estás seguro de eliminar a ${module.name}?`);
    if (confirmacion && module.id !== undefined) {
      // Aquí llamarías a tu servicio de NestJS
      this.moduleService.delete(module.id).subscribe();
      console.log('Eliminado id:', module.id);
    }
  }
}
