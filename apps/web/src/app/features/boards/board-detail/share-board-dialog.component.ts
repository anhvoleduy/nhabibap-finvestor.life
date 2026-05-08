import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BoardDto } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../core/board-api.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-share-board-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Chia sẻ bảng</h2>
    <mat-dialog-content>
      <form
        [formGroup]="form"
        (ngSubmit)="share()"
        style="display:flex;flex-direction:column;gap:12px;padding-top:8px"
      >
        <mat-form-field appearance="outline">
          <mat-label>Email người dùng</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Quyền</mat-label>
          <mat-select formControlName="role">
            <mat-option value="EDITOR">Chỉnh sửa</mat-option>
            <mat-option value="VIEWER">Xem</mat-option>
          </mat-select>
        </mat-form-field>
        @if (error()) {
          <p style="color:#ef4444;font-size:13px">{{ error() }}</p>
        }
        @if (success()) {
          <p style="color:#22c55e;font-size:13px">Đã chia sẻ thành công!</p>
        }
      </form>

      @if (data.board.members.length > 0) {
        <div style="margin-top:16px">
          <p style="font-weight:600;margin-bottom:8px">Thành viên hiện tại</p>
          @for (m of data.board.members; track m.userId) {
            <div
              style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb"
            >
              <div>
                <div style="font-weight:500">{{ m.name }}</div>
                <div style="font-size:12px;color:#6b7280">
                  {{ m.email }} ·
                  {{ m.role === 'EDITOR' ? 'Chỉnh sửa' : 'Xem' }}
                </div>
              </div>
              <button mat-icon-button color="warn" (click)="remove(m.userId)">
                <mat-icon>person_remove</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Đóng</button>
      <button
        mat-flat-button
        (click)="share()"
        [disabled]="form.invalid || loading()"
      >
        Chia sẻ
      </button>
    </mat-dialog-actions>
  `,
})
export class ShareBoardDialogComponent {
  readonly data = inject<{ board: BoardDto }>(MAT_DIALOG_DATA);
  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['EDITOR' as 'EDITOR' | 'VIEWER', Validators.required],
  });
  loading = signal(false);
  error = signal('');
  success = signal(false);

  share() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    this.api.addMember(this.data.board.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        this.form.reset({ email: '', role: 'EDITOR' });
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Lỗi');
        this.loading.set(false);
      },
    });
  }

  remove(userId: string) {
    this.api.removeMember(this.data.board.id, userId).subscribe(() => {
      this.data.board.members = this.data.board.members.filter(
        (m) => m.userId !== userId,
      );
    });
  }
}
