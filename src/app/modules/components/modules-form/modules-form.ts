import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ModuleModel } from '../../models/module.model';

@Component({
  selector: 'app-modules-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './modules-form.html'
})
export class ModulesForm {

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ModulesForm>);
  public data: ModuleModel | null = inject(MAT_DIALOG_DATA, { optional: true });

  public isEditMode = !!this.data;

  form: FormGroup = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? '', [Validators.required]],
  });

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
