import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">Cài đặt tài khoản</h2>
        <p class="page__subtitle">Quản lý thông tin và bảo mật tài khoản</p>
      </div>

      <mat-card class="section-card">
        @if (profileLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          <h3 class="section-title">Thông tin cá nhân</h3>

          <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Họ tên</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="name" autocomplete="name" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
              />
            </mat-form-field>

            @if (profileError()) {
              <div class="msg msg--error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ profileError() }}</span>
              </div>
            }
            @if (profileSuccess()) {
              <div class="msg msg--success">
                <mat-icon>check_circle_outline</mat-icon>
                <span>Cập nhật thành công</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              [disabled]="
                profileLoading() || profileForm.invalid || profileForm.pristine
              "
            >
              Lưu thay đổi
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        @if (pwLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          <h3 class="section-title">Đổi mật khẩu</h3>

          <form [formGroup]="pwForm" (ngSubmit)="submitPassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mật khẩu hiện tại</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                type="password"
                formControlName="currentPassword"
                autocomplete="current-password"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mật khẩu mới</mat-label>
              <mat-icon matPrefix>lock_reset</mat-icon>
              <input
                matInput
                type="password"
                formControlName="newPassword"
                autocomplete="new-password"
              />
              <mat-hint>Tối thiểu 8 ký tự</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Xác nhận mật khẩu mới</mat-label>
              <mat-icon matPrefix>lock_reset</mat-icon>
              <input
                matInput
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              @if (pwForm.hasError('mismatch')) {
                <mat-error>Mật khẩu xác nhận không khớp</mat-error>
              }
            </mat-form-field>

            @if (pwError()) {
              <div class="msg msg--error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ pwError() }}</span>
              </div>
            }
            @if (pwSuccess()) {
              <div class="msg msg--success">
                <mat-icon>check_circle_outline</mat-icon>
                <span>Đổi mật khẩu thành công</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              [disabled]="pwLoading() || pwForm.invalid"
            >
              Đổi mật khẩu
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 600px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .page__header {
        margin-bottom: 4px;
      }

      .page__title {
        margin: 0 0 4px;
        font-size: 26px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        letter-spacing: -0.5px;
      }

      .page__subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
      }

      .section-card {
        overflow: hidden;
        border-radius: 16px !important;
      }

      .section-title {
        margin: 0 0 20px;
        font-size: 17px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .full-width {
        display: block;
        width: 100%;
        margin-bottom: 4px;
      }

      .msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 12px;
        border-radius: 8px;
        font-size: 14px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .msg--error {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }

      .msg--success {
        background: #dcfce7;
        color: #166534;
      }
    `,
  ],
})
export class SettingsComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  profileForm = this.fb.nonNullable.group({
    name: [this.auth.currentUser()?.name ?? '', Validators.required],
    email: [
      this.auth.currentUser()?.email ?? '',
      [Validators.required, Validators.email],
    ],
  });

  pwForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: confirmMatchValidator },
  );

  profileLoading = signal(false);
  profileError = signal('');
  profileSuccess = signal(false);

  pwLoading = signal(false);
  pwError = signal('');
  pwSuccess = signal(false);

  submitProfile() {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    this.profileLoading.set(true);
    this.profileError.set('');
    this.profileSuccess.set(false);
    const { name, email } = this.profileForm.getRawValue();
    this.auth.updateProfile({ name, email }).subscribe({
      next: () => {
        this.profileSuccess.set(true);
        this.profileForm.markAsPristine();
        this.profileLoading.set(false);
      },
      error: (e) => {
        this.profileError.set(e?.error?.message ?? 'Cập nhật thất bại');
        this.profileLoading.set(false);
      },
    });
  }

  submitPassword() {
    if (this.pwForm.invalid) return;
    this.pwLoading.set(true);
    this.pwError.set('');
    this.pwSuccess.set(false);
    const { currentPassword, newPassword } = this.pwForm.getRawValue();
    this.auth.updatePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.pwSuccess.set(true);
        this.pwForm.reset();
        this.pwLoading.set(false);
      },
      error: (e) => {
        this.pwError.set(e?.error?.message ?? 'Đổi mật khẩu thất bại');
        this.pwLoading.set(false);
      },
    });
  }
}

function confirmMatchValidator(
  group: import('@angular/forms').AbstractControl,
) {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { mismatch: true };
}
