import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDeleteDialogData {
  productName: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">Confirmar eliminación</h2>
    <mat-dialog-content>
      <p class="dialog-message">
        ¿Estás seguro de eliminar <strong>{{ data.productName }}</strong>?
        Esta acción no se puede deshacer.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancelar</button>
      <button mat-flat-button class="delete-btn" (click)="confirm()">
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      color: var(--color-text-primary, #111827);
      font-weight: 600;
    }
    .dialog-message {
      color: var(--color-text-secondary, #6B7280);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .dialog-message strong {
      color: var(--color-text-primary, #111827);
    }
    .cancel-btn {
      color: var(--color-text-secondary, #6B7280);
    }
    .delete-btn {
      background: #E74C3C;
      color: #FFFFFF;
    }
    .delete-btn:hover {
      background: #C0392B;
    }
  `],
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent>);
  readonly data: ConfirmDeleteDialogData = inject(MAT_DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }
}
