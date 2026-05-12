import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
} from '../../../core/models/order.model';

export interface ChangeStatusDialogData {
  orderId: number;
  currentStatus: OrderStatus;
  validTransitions: readonly OrderStatus[];
}

@Component({
  selector: 'app-change-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">Cambiar Estado del Pedido #{{ data.orderId }}</h2>
    <mat-dialog-content>
      <p class="dialog-current">
        Estado actual:
        <span class="status-badge" [class]="'status-' + data.currentStatus.toLowerCase()">
          {{ statusLabels[data.currentStatus] }}
        </span>
      </p>
      <mat-form-field appearance="outline" class="dialog-select">
        <mat-label>Nuevo estado</mat-label>
        <mat-select [(value)]="selectedStatus">
          @for (status of data.validTransitions; track status) {
            <mat-option [value]="status">{{ statusLabels[status] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!selectedStatus"
        (click)="confirm()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      color: rgba(255, 255, 255, 0.9);
    }
    .dialog-current {
      margin-bottom: 16px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.875rem;
    }
    .dialog-select {
      width: 100%;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-pending            { background: rgba(158,158,158,0.15); color: #9E9E9E; }
    .status-preparing          { background: rgba(255,193,7,0.15);   color: #FFC107; }
    .status-ready_for_dispatch { background: rgba(41,182,246,0.15);  color: #29B6F6; }
    .status-dispatched         { background: rgba(25,118,210,0.15);  color: #1976D2; }
    .status-delivered          { background: rgba(76,175,80,0.15);   color: #4CAF50; }
    .status-cancelled          { background: rgba(244,67,54,0.15);   color: #F44336; }
  `],
})
export class ChangeStatusDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ChangeStatusDialogComponent>);
  readonly data: ChangeStatusDialogData = inject(MAT_DIALOG_DATA);
  readonly statusLabels = ORDER_STATUS_LABELS;

  selectedStatus: OrderStatus | null = null;

  confirm(): void {
    if (this.selectedStatus) {
      this.dialogRef.close(this.selectedStatus);
    }
  }
}
