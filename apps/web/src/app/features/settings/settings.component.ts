import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">{{ 'SETTINGS.TITLE' | translate }}</h2>
        <p class="page__subtitle">{{ 'SETTINGS.SUBTITLE' | translate }}</p>
      </div>

      <mat-card class="section-card">
        @if (profileLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          <h3 class="section-title">
            {{ 'SETTINGS.PROFILE.TITLE' | translate }}
          </h3>

          <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'SETTINGS.PROFILE.NAME' | translate }}</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="name" autocomplete="name" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'COMMON.EMAIL' | translate }}</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
              />
              @if (emailVerified()) {
                <mat-icon
                  matSuffix
                  class="email-verified"
                  [matTooltip]="'SETTINGS.PROFILE.EMAIL_VERIFIED' | translate"
                  >verified</mat-icon
                >
              } @else {
                @switch (resendState()) {
                  @case ('sent') {
                    <span matSuffix class="email-resent">
                      <mat-icon>check</mat-icon>
                      {{ 'SETTINGS.PROFILE.RESENT' | translate }}
                    </span>
                  }
                  @default {
                    <button
                      matSuffix
                      mat-button
                      type="button"
                      class="email-resend"
                      [disabled]="resendState() === 'sending'"
                      [matTooltip]="
                        'SETTINGS.PROFILE.EMAIL_UNVERIFIED' | translate
                      "
                      (click)="resendVerification()"
                    >
                      {{
                        (resendState() === 'error'
                          ? 'SETTINGS.PROFILE.RESEND_RETRY'
                          : 'SETTINGS.PROFILE.RESEND'
                        ) | translate
                      }}
                    </button>
                  }
                }
              }
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
                <span>{{ 'SETTINGS.PROFILE.SUCCESS' | translate }}</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              [disabled]="
                profileLoading() || profileForm.invalid || profileForm.pristine
              "
            >
              {{ 'SETTINGS.PROFILE.SAVE' | translate }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="section-card">
        @if (pwLoading()) {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          <h3 class="section-title">
            {{ 'SETTINGS.PASSWORD.TITLE' | translate }}
          </h3>

          <form [formGroup]="pwForm" (ngSubmit)="submitPassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{
                'SETTINGS.PASSWORD.CURRENT' | translate
              }}</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                type="password"
                formControlName="currentPassword"
                autocomplete="current-password"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'SETTINGS.PASSWORD.NEW' | translate }}</mat-label>
              <mat-icon matPrefix>lock_reset</mat-icon>
              <input
                matInput
                type="password"
                formControlName="newPassword"
                autocomplete="new-password"
              />
              <mat-hint>{{ 'SETTINGS.PASSWORD.MIN_8' | translate }}</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{
                'SETTINGS.PASSWORD.CONFIRM' | translate
              }}</mat-label>
              <mat-icon matPrefix>lock_reset</mat-icon>
              <input
                matInput
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              @if (pwForm.hasError('mismatch')) {
                <mat-error>{{
                  'SETTINGS.PASSWORD.MISMATCH' | translate
                }}</mat-error>
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
                <span>{{ 'SETTINGS.PASSWORD.SUCCESS' | translate }}</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              [disabled]="pwLoading() || pwForm.invalid"
            >
              {{ 'SETTINGS.PASSWORD.SUBMIT' | translate }}
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

      .email-verified {
        color: #16a34a;
      }

      .email-resent {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #166534;
        white-space: nowrap;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .email-resend {
        white-space: nowrap;
      }
    `,
  ],
})
export class SettingsComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

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

  emailVerified = computed(
    () => this.auth.currentUser()?.emailVerified === true,
  );
  resendState = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');

  resendVerification() {
    const email = this.auth.currentUser()?.email;
    if (!email || this.resendState() === 'sending') return;
    this.resendState.set('sending');
    this.auth.resendVerification({ email }).subscribe({
      next: () => this.resendState.set('sent'),
      error: () => this.resendState.set('error'),
    });
  }

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
        this.profileError.set(
          e?.error?.message ??
            this.translate.instant('SETTINGS.PROFILE.ERROR_DEFAULT'),
        );
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
        this.pwError.set(
          e?.error?.message ??
            this.translate.instant('SETTINGS.PASSWORD.ERROR_DEFAULT'),
        );
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
