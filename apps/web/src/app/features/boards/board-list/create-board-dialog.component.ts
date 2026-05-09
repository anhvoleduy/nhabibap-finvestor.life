import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'BOARDS.CREATE.TITLE' | translate }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="confirm()">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>{{ 'BOARDS.CREATE.CATEGORY_NAME' | translate }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        {{ 'COMMON.CANCEL' | translate }}
      </button>
      <button mat-flat-button (click)="confirm()" [disabled]="form.invalid">
        {{ 'COMMON.CREATE' | translate }}
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
