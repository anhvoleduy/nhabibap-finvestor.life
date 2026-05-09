import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-brand">
        <div class="brand-icon-wrap">
          <mat-icon class="brand-icon">trending_up</mat-icon>
        </div>
        <span class="brand-name">Portfolio Tracker</span>
      </div>

      <mat-card class="auth-card">
        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          <h2 class="auth-title">{{ 'AUTH.LOGIN.TITLE' | translate }}</h2>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'COMMON.EMAIL' | translate }}</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'AUTH.PASSWORD' | translate }}</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
            </mat-form-field>

            @if (error()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              class="submit-btn"
              [disabled]="loading() || form.invalid"
            >
              {{ 'AUTH.LOGIN.SUBMIT' | translate }}
            </button>
          </form>

          <div class="auth-footer">
            <span>{{ 'AUTH.LOGIN.NO_ACCOUNT' | translate }}</span>
            <a routerLink="/auth/register" class="auth-link">{{
              'AUTH.LOGIN.REGISTER_LINK' | translate
            }}</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 24px;
        gap: 24px;
        background: var(--mat-sys-surface-container-lowest);
      }

      .auth-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .brand-icon-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: var(--mat-sys-primary-container);
      }

      .brand-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--mat-sys-on-primary-container);
      }

      .brand-name {
        font-size: 20px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        letter-spacing: 0.3px;
      }

      .auth-card {
        width: 100%;
        max-width: 420px;
        overflow: hidden;
      }

      .auth-title {
        margin: 0 0 24px;
        font-size: 22px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
      }

      .full-width {
        display: block;
        width: 100%;
        margin-bottom: 4px;
      }

      .error-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        margin-bottom: 12px;
        border-radius: 8px;
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
        font-size: 14px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .submit-btn {
        width: 100%;
        height: 48px;
        margin-top: 8px;
        font-size: 15px;
        letter-spacing: 0.3px;
      }

      .auth-footer {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        margin-top: 20px;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
      }

      .auth-link {
        color: var(--mat-sys-primary);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = signal(false);
  error = signal('');

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/boards']),
      error: (e) => {
        this.error.set(
          e?.error?.message ??
            this.translate.instant('AUTH.LOGIN.ERROR_DEFAULT'),
        );
        this.loading.set(false);
      },
    });
  }
}
