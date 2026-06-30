import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth.service';

type VerifyState = 'verifying' | 'success' | 'error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  template: `
    <div class="verify-shell">
      <mat-card class="verify-card">
        @if (state() === 'verifying') {
          <mat-progress-bar mode="indeterminate" />
        }
        <mat-card-content>
          @switch (state()) {
            @case ('verifying') {
              <mat-icon class="state-icon">hourglass_top</mat-icon>
              <h2 class="verify-title">
                {{ 'AUTH.VERIFY.VERIFYING' | translate }}
              </h2>
            }
            @case ('success') {
              <mat-icon class="state-icon state-icon--ok"
                >check_circle</mat-icon
              >
              <h2 class="verify-title">
                {{ 'AUTH.VERIFY.SUCCESS' | translate }}
              </h2>
              <p class="verify-text">
                {{ 'AUTH.VERIFY.REDIRECTING' | translate }}
              </p>
            }
            @case ('error') {
              <mat-icon class="state-icon state-icon--err">error</mat-icon>
              <h2 class="verify-title">
                {{ 'AUTH.VERIFY.FAILED' | translate }}
              </h2>
              <p class="verify-text">{{ error() }}</p>
              <a mat-flat-button routerLink="/auth/login" class="verify-btn">
                {{ 'AUTH.VERIFY.BACK_TO_LOGIN' | translate }}
              </a>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .verify-shell {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 24px;
        background: var(--mat-sys-surface-container-lowest);
      }

      .verify-card {
        width: 100%;
        max-width: 420px;
        overflow: hidden;
        text-align: center;
      }

      .state-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin: 16px auto 8px;
        color: var(--mat-sys-on-surface-variant);
      }

      .state-icon--ok {
        color: var(--mat-sys-primary);
      }

      .state-icon--err {
        color: var(--mat-sys-error);
      }

      .verify-title {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }

      .verify-text {
        margin: 0 0 16px;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
      }

      .verify-btn {
        margin-top: 8px;
      }
    `,
  ],
})
export class VerifyEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly token = input<string>();

  readonly state = signal<VerifyState>('verifying');
  readonly error = signal('');

  constructor() {
    effect(() => {
      const token = this.token();
      if (!token) {
        this.state.set('error');
        this.error.set('Missing verification token.');
        return;
      }
      this.auth.verifyEmail(token).subscribe({
        next: () => {
          this.state.set('success');
          setTimeout(() => this.router.navigate(['/boards']), 1500);
        },
        error: (e) => {
          this.state.set('error');
          this.error.set(e?.error?.message ?? 'Verification failed.');
        },
      });
    });
  }
}
