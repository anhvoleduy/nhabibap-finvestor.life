import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Tạo danh mục mới</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="confirm()">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Tên danh mục</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Huỷ</button>
      <button mat-flat-button (click)="confirm()" [disabled]="form.invalid">
        Tạo
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateBoardDialogComponent {
  private readonly ref = inject(MatDialogRef<CreateBoardDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({ name: ['', Validators.required] });

  confirm() {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue().name);
  }
}
