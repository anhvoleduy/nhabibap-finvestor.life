import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rename-board-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Đổi tên danh mục</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="confirm()" id="renameForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tên mới</mat-label>
          <input matInput formControlName="name" autocomplete="off" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Huỷ</button>
      <button
        mat-flat-button
        form="renameForm"
        type="submit"
        [disabled]="form.invalid"
      >
        Lưu
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        display: block;
        width: 100%;
        margin-top: 8px;
      }
    `,
  ],
})
export class RenameBoardDialogComponent {
  private readonly ref = inject(MatDialogRef<RenameBoardDialogComponent>);
  private readonly data: { name: string } = inject(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    name: [this.data.name, [Validators.required, Validators.minLength(1)]],
  });

  confirm() {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue().name);
  }
}
