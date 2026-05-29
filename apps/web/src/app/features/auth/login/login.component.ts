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
    <div class="auth-shell">
      <aside class="auth-hero">
        <div class="auth-brand">
          <div class="brand-icon-wrap">
            <mat-icon class="brand-icon">trending_up</mat-icon>
          </div>
          <span class="brand-name">Finvestor.Life</span>
        </div>

        <div class="hero-copy">
          <h1 class="hero-title">{{ 'AUTH.HERO.TITLE' | translate }}</h1>
          <p class="hero-subtitle">{{ 'AUTH.HERO.SUBTITLE' | translate }}</p>
          <ul class="hero-features">
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ 'AUTH.HERO.F1' | translate }}</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ 'AUTH.HERO.F2' | translate }}</span>
            </li>
            <li>
              <mat-icon>check_circle</mat-icon>
              <span>{{ 'AUTH.HERO.F3' | translate }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <main class="auth-form-pane">
        <mat-card class="auth-card">
          @if (loading()) {
            <mat-progress-bar mode="indeterminate" />
          }
          <mat-card-content>
            <div class="auth-brand auth-brand--mobile">
              <div class="brand-icon-wrap">
                <mat-icon class="brand-icon">trending_up</mat-icon>
              </div>
              <span class="brand-name">Finvestor.Life</span>
            </div>

            <h2 class="auth-title">{{ 'AUTH.LOGIN.TITLE' | translate }}</h2>
            <p class="auth-subtitle">{{ 'AUTH.LOGIN.SUBTITLE' | translate }}</p>

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
                  [type]="hidePassword() ? 'password' : 'text'"
                  formControlName="password"
                  autocomplete="current-password"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  tabindex="-1"
                  (click)="hidePassword.set(!hidePassword())"
                  [attr.aria-label]="
                    (hidePassword()
                      ? 'AUTH.SHOW_PASSWORD'
                      : 'AUTH.HIDE_PASSWORD'
                    ) | translate
                  "
                  [attr.aria-pressed]="!hidePassword()"
                >
                  <mat-icon>{{
                    hidePassword() ? 'visibility' : 'visibility_off'
                  }}</mat-icon>
                </button>
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
      </main>
    </div>
  `,
  styles: [
    `
      .auth-shell {
        display: flex;
        min-height: 100vh;
        background: var(--mat-sys-surface-container-lowest);
      }

      .auth-hero {
        flex: 1 1 50%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 48px;
        padding: 56px 64px;
        color: var(--mat-sys-on-primary);
        background: linear-gradient(
          135deg,
          var(--mat-sys-primary) 0%,
          var(--mat-sys-tertiary) 100%
        );
      }

      .hero-copy {
        max-width: 440px;
      }

      .hero-title {
        margin: 0 0 16px;
        font-size: 40px;
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .hero-subtitle {
        margin: 0 0 32px;
        font-size: 17px;
        line-height: 1.5;
        opacity: 0.85;
      }

      .hero-features {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .hero-features li {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
      }

      .hero-features mat-icon {
        flex-shrink: 0;
        opacity: 0.95;
      }

      .auth-form-pane {
        flex: 1 1 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 24px;
      }

      .auth-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .auth-brand--mobile {
        display: none;
        justify-content: center;
        margin-bottom: 24px;
      }

      .brand-icon-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.18);
      }

      .auth-brand--mobile .brand-icon-wrap {
        background: var(--mat-sys-primary-container);
      }

      .brand-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--mat-sys-on-primary);
      }

      .auth-brand--mobile .brand-icon {
        color: var(--mat-sys-on-primary-container);
      }

      .brand-name {
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0.3px;
      }

      .auth-brand--mobile .brand-name {
        color: var(--mat-sys-on-surface);
      }

      .auth-card {
        width: 100%;
        max-width: 420px;
        overflow: hidden;
      }

      .auth-title {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .auth-subtitle {
        margin: 0 0 24px;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
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

      @media (max-width: 900px) {
        .auth-hero {
          display: none;
        }

        .auth-brand--mobile {
          display: flex;
        }

        .auth-form-pane {
          flex-basis: 100%;
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
  hidePassword = signal(true);

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
