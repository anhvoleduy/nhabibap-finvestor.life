import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { LanguageService } from '../../../core/language.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="shell">
      <nav class="sidebar">
        <div class="sidebar__brand">
          <div class="brand-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <span class="brand-name">Portfolio</span>
        </div>

        <div class="sidebar__nav">
          <a
            routerLink="/boards"
            routerLinkActive="nav-item--active"
            class="nav-item"
          >
            <mat-icon>dashboard</mat-icon>
            <span>{{ 'SHELL.NAV.BOARDS' | translate }}</span>
          </a>
          <a
            routerLink="/settings"
            routerLinkActive="nav-item--active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item"
          >
            <mat-icon>settings</mat-icon>
            <span>{{ 'SHELL.NAV.SETTINGS' | translate }}</span>
          </a>
        </div>

        <div class="sidebar__footer">
          <div class="user-section">
            <div class="avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.currentUser()?.name }}</div>
              <div class="user-email">{{ auth.currentUser()?.email }}</div>
            </div>
          </div>
          <div class="footer-actions">
            <button
              mat-icon-button
              (click)="toggleLang()"
              [matTooltip]="
                lang.currentLang() === 'vi'
                  ? ('SHELL.LANG_EN' | translate)
                  : ('SHELL.LANG_VI' | translate)
              "
            >
              <span class="lang-badge">{{
                lang.currentLang() === 'vi' ? 'EN' : 'VI'
              }}</span>
            </button>
            <button
              mat-icon-button
              (click)="theme.toggle()"
              [matTooltip]="
                theme.isDark()
                  ? ('SHELL.LIGHT_MODE' | translate)
                  : ('SHELL.DARK_MODE' | translate)
              "
            >
              <mat-icon>{{
                theme.isDark() ? 'light_mode' : 'dark_mode'
              }}</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="auth.logout()"
              [matTooltip]="'SHELL.LOGOUT' | translate"
            >
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </div>
      </nav>

      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background: var(--mat-sys-background);
      }

      .sidebar {
        width: 240px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background: var(--mat-sys-surface);
        border-right: 1px solid var(--mat-sys-outline-variant);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 16px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .brand-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
        flex-shrink: 0;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .brand-name {
        font-size: 16px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        letter-spacing: -0.3px;
      }

      .sidebar__nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        color: var(--mat-sys-on-surface-variant);
        text-decoration: none;
        transition:
          background 150ms,
          color 150ms;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        &:hover {
          background: color-mix(
            in srgb,
            var(--mat-sys-on-surface) 8%,
            transparent
          );
          color: var(--mat-sys-on-surface);
        }
      }

      .nav-item--active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);

        &:hover {
          background: var(--mat-sys-primary-container);
          opacity: 0.9;
        }
      }

      .sidebar__footer {
        padding: 12px 8px;
        border-top: 1px solid var(--mat-sys-outline-variant);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .user-section {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 10px;
        background: color-mix(
          in srgb,
          var(--mat-sys-on-surface) 4%,
          transparent
        );
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
        letter-spacing: 0.5px;
      }

      .user-info {
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-email {
        font-size: 11px;
        color: var(--mat-sys-on-surface-variant);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .footer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 2px;
      }

      .lang-badge {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .content {
        flex: 1;
        overflow-y: auto;
        min-width: 0;
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly lang = inject(LanguageService);

  initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  });

  toggleLang() {
    this.lang.setLanguage(this.lang.currentLang() === 'vi' ? 'en' : 'vi');
  }
}
