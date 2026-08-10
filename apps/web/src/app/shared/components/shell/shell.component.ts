import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { LanguageService } from '../../../core/language.service';

const COLLAPSE_KEY = 'shell.sidebar.collapsed';
const MOBILE_BREAKPOINT = 768;

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
    <div
      class="shell"
      [class.shell--collapsed]="collapsed()"
      [class.shell--mobile-open]="mobileOpen()"
    >
      <button
        mat-icon-button
        class="mobile-toggle"
        (click)="openMobile()"
        [attr.aria-label]="'SHELL.MENU' | translate"
      >
        <mat-icon>menu</mat-icon>
      </button>

      @if (mobileOpen()) {
        <div class="backdrop" (click)="closeMobile()" aria-hidden="true"></div>
      }

      <nav class="sidebar">
        <div class="sidebar__brand">
          <div class="brand-icon">
            <mat-icon>trending_up</mat-icon>
          </div>
          <span class="brand-name">Finvestor.Life</span>
          <button
            mat-icon-button
            class="collapse-btn collapse-btn--desktop"
            (click)="toggleCollapsed()"
            [matTooltip]="
              collapsed()
                ? ('SHELL.EXPAND' | translate)
                : ('SHELL.COLLAPSE' | translate)
            "
          >
            <mat-icon>{{
              collapsed() ? 'chevron_right' : 'chevron_left'
            }}</mat-icon>
          </button>
          <button
            mat-icon-button
            class="collapse-btn collapse-btn--mobile"
            (click)="closeMobile()"
            [attr.aria-label]="'SHELL.CLOSE' | translate"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="sidebar__nav">
          <a
            routerLink="/boards"
            routerLinkActive="nav-item--active"
            class="nav-item"
            [matTooltip]="collapsed() ? ('SHELL.NAV.BOARDS' | translate) : ''"
            matTooltipPosition="right"
          >
            <mat-icon>dashboard</mat-icon>
            <span class="nav-item__label">{{
              'SHELL.NAV.BOARDS' | translate
            }}</span>
          </a>
          <a
            routerLink="/dca-calendar"
            routerLinkActive="nav-item--active"
            class="nav-item"
            [matTooltip]="
              collapsed() ? ('SHELL.NAV.DCA_CALENDAR' | translate) : ''
            "
            matTooltipPosition="right"
          >
            <mat-icon>calendar_month</mat-icon>
            <span class="nav-item__label">{{
              'SHELL.NAV.DCA_CALENDAR' | translate
            }}</span>
          </a>
          <a
            routerLink="/settings"
            routerLinkActive="nav-item--active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-item"
            [matTooltip]="collapsed() ? ('SHELL.NAV.SETTINGS' | translate) : ''"
            matTooltipPosition="right"
          >
            <mat-icon>settings</mat-icon>
            <span class="nav-item__label">{{
              'SHELL.NAV.SETTINGS' | translate
            }}</span>
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
        @if (unverified()) {
          <div class="verify-banner" role="status">
            <mat-icon class="verify-banner__icon">mark_email_unread</mat-icon>
            <span class="verify-banner__text">{{
              'SHELL.VERIFY_BANNER.TEXT' | translate
            }}</span>
            @switch (resendState()) {
              @case ('sent') {
                <span class="verify-banner__sent">
                  <mat-icon>check</mat-icon>
                  {{ 'SHELL.VERIFY_BANNER.SENT' | translate }}
                </span>
              }
              @default {
                <button
                  mat-button
                  class="verify-banner__action"
                  [disabled]="resendState() === 'sending'"
                  (click)="resendVerification()"
                >
                  {{
                    (resendState() === 'error'
                      ? 'SHELL.VERIFY_BANNER.RETRY'
                      : 'SHELL.VERIFY_BANNER.RESEND'
                    ) | translate
                  }}
                </button>
              }
            }
          </div>
        }
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        --sidebar-width: 240px;
        --sidebar-width-collapsed: 72px;
      }

      .shell {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background: var(--mat-sys-background);
        position: relative;
      }

      .sidebar {
        width: var(--sidebar-width);
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        background: var(--mat-sys-surface);
        border-right: 1px solid var(--mat-sys-outline-variant);
        transition: width 200ms ease;
      }

      .shell--collapsed .sidebar {
        width: var(--sidebar-width-collapsed);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        min-height: 64px;
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
        flex: 1;
        font-size: 16px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        letter-spacing: -0.3px;
        white-space: nowrap;
        overflow: hidden;
        opacity: 1;
        transition: opacity 150ms;
      }

      .shell--collapsed .brand-name {
        opacity: 0;
        width: 0;
        pointer-events: none;
      }

      .shell--collapsed .sidebar__brand {
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 16px 8px;
      }

      .collapse-btn {
        flex-shrink: 0;
      }

      .collapse-btn--mobile {
        display: none;
      }

      .sidebar__nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
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
        white-space: nowrap;
        overflow: hidden;
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

      .nav-item__label {
        opacity: 1;
        transition: opacity 150ms;
      }

      .shell--collapsed .nav-item {
        justify-content: center;
        padding: 10px;
      }

      .shell--collapsed .nav-item__label {
        opacity: 0;
        width: 0;
        pointer-events: none;
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
        overflow: hidden;
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
        opacity: 1;
        transition: opacity 150ms;
      }

      .shell--collapsed .user-info,
      .shell--collapsed .footer-actions {
        opacity: 0;
        height: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .shell--collapsed .user-section {
        justify-content: center;
        padding: 8px;
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

      .verify-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
        font-size: 14px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      .verify-banner__icon {
        flex-shrink: 0;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .verify-banner__text {
        flex: 1;
        min-width: 0;
      }

      .verify-banner__action {
        flex-shrink: 0;
        font-weight: 600;
      }

      .verify-banner__sent {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        font-weight: 600;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .mobile-toggle {
        display: none;
        position: fixed;
        top: 8px;
        left: 8px;
        z-index: 30;
        background: var(--mat-sys-surface);
        border: 1px solid var(--mat-sys-outline-variant);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }

      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 40;
        animation: fade-in 150ms ease;
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 50;
          width: min(82vw, 300px) !important;
          transform: translateX(-100%);
          transition: transform 220ms ease;
          box-shadow: 4px 0 16px rgba(0, 0, 0, 0.18);
        }

        .shell--mobile-open .sidebar {
          transform: translateX(0);
        }

        /* on mobile, ignore desktop collapsed state — drawer always full */
        .shell--collapsed .sidebar {
          width: min(82vw, 300px) !important;
        }

        .shell--collapsed .brand-name,
        .shell--collapsed .nav-item__label,
        .shell--collapsed .user-info,
        .shell--collapsed .footer-actions {
          opacity: 1;
          width: auto;
          height: auto;
          pointer-events: auto;
        }

        .shell--collapsed .nav-item {
          justify-content: flex-start;
          padding: 10px 12px;
        }

        .shell--collapsed .user-section {
          justify-content: flex-start;
          padding: 8px 12px;
        }

        .mobile-toggle {
          display: inline-flex;
        }

        .collapse-btn--desktop {
          display: none;
        }

        .collapse-btn--mobile {
          display: inline-flex;
        }

        .content {
          padding-top: 56px;
        }
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  collapsed = signal(localStorage.getItem(COLLAPSE_KEY) === '1');
  mobileOpen = signal(false);
  resendState = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');

  readonly unverified = computed(
    () => this.auth.currentUser()?.emailVerified === false,
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        if (this.mobileOpen()) this.mobileOpen.set(false);
      });
  }

  initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  });

  resendVerification() {
    const email = this.auth.currentUser()?.email;
    if (!email || this.resendState() === 'sending') return;
    this.resendState.set('sending');
    this.auth.resendVerification({ email }).subscribe({
      next: () => this.resendState.set('sent'),
      error: () => this.resendState.set('error'),
    });
  }

  toggleLang() {
    this.lang.setLanguage(this.lang.currentLang() === 'vi' ? 'en' : 'vi');
  }

  toggleCollapsed() {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  }

  openMobile() {
    this.mobileOpen.set(true);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > MOBILE_BREAKPOINT && this.mobileOpen()) {
      this.mobileOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.mobileOpen()) this.mobileOpen.set(false);
  }
}
