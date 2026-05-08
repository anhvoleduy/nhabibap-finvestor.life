import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import {
  CATEGORY_LABELS,
  CategoryType,
} from '@nhabibap-myportfolio/shared-types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-category-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Thêm danh mục</h2>
    <mat-dialog-content style="padding-top:8px">
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Loại danh mục</mat-label>
          <mat-select formControlName="type">
            @for (opt of availableTypes; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Huỷ</button>
      <button mat-flat-button (click)="confirm()" [disabled]="form.invalid">
        Thêm
      </button>
    </mat-dialog-actions>
  `,
})
export class AddCategoryDialogComponent {
  readonly data = inject<{ usedTypes: CategoryType[] }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AddCategoryDialogComponent>);
  private readonly fb = inject(FormBuilder);

  availableTypes = (Object.values(CategoryType) as CategoryType[])
    .filter((t) => !this.data.usedTypes.includes(t))
    .map((t) => ({ value: t, label: CATEGORY_LABELS[t] }));

  form = this.fb.nonNullable.group({
    type: ['' as CategoryType, Validators.required],
  });

  confirm() {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue().type);
  }
}
