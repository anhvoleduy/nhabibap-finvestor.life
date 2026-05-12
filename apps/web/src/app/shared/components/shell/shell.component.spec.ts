import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ShellComponent } from './shell.component';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { LanguageService } from '../../../core/language.service';

const COLLAPSE_KEY = 'shell.sidebar.collapsed';

let auth: {
  currentUser: ReturnType<
    typeof signal<{ name: string; email: string } | null>
  >;
  logout: ReturnType<typeof vi.fn>;
};
let theme: {
  isDark: ReturnType<typeof signal<boolean>>;
  toggle: ReturnType<typeof vi.fn>;
};
let lang: {
  currentLang: ReturnType<typeof signal<'vi' | 'en'>>;
  setLanguage: ReturnType<typeof vi.fn>;
};
let routerEvents: Subject<unknown>;

function setup(): {
  fixture: ComponentFixture<ShellComponent>;
  component: ShellComponent;
} {
  auth = {
    currentUser: signal({ name: 'Jane Doe', email: 'jane@example.com' }),
    logout: vi.fn(),
  };
  theme = { isDark: signal(false), toggle: vi.fn() };
  lang = { currentLang: signal('vi'), setLanguage: vi.fn() };
  routerEvents = new Subject<unknown>();

  TestBed.configureTestingModule({
    imports: [ShellComponent],
    providers: [
      provideRouter([]),
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: AuthService, useValue: auth },
      { provide: ThemeService, useValue: theme },
      { provide: LanguageService, useValue: lang },
    ],
  });

  // Replace router.events with a Subject we can push to without changing routes.
  const router = TestBed.inject(Router);
  Object.defineProperty(router, 'events', {
    get: () => routerEvents.asObservable(),
    configurable: true,
  });

  const fixture = TestBed.createComponent(ShellComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('ShellComponent', () => {
  beforeEach(() => {
    localStorage.removeItem(COLLAPSE_KEY);
  });

  describe('collapsed state', () => {
    it('starts expanded when localStorage has no flag', () => {
      const { component } = setup();
      expect(component.collapsed()).toBe(false);
    });

    it('starts collapsed when localStorage flag is "1"', () => {
      localStorage.setItem(COLLAPSE_KEY, '1');
      const { component } = setup();
      expect(component.collapsed()).toBe(true);
    });

    it('toggleCollapsed flips signal and persists to localStorage', () => {
      const { component } = setup();
      component.toggleCollapsed();
      expect(component.collapsed()).toBe(true);
      expect(localStorage.getItem(COLLAPSE_KEY)).toBe('1');

      component.toggleCollapsed();
      expect(component.collapsed()).toBe(false);
      expect(localStorage.getItem(COLLAPSE_KEY)).toBe('0');
    });
  });

  describe('mobile drawer', () => {
    it('openMobile sets mobileOpen true', () => {
      const { component } = setup();
      component.openMobile();
      expect(component.mobileOpen()).toBe(true);
    });

    it('closeMobile sets mobileOpen false', () => {
      const { component } = setup();
      component.openMobile();
      component.closeMobile();
      expect(component.mobileOpen()).toBe(false);
    });

    it('Escape closes drawer when open', () => {
      const { component } = setup();
      component.openMobile();
      component.onEscape();
      expect(component.mobileOpen()).toBe(false);
    });

    it('Escape no-op when drawer closed', () => {
      const { component } = setup();
      component.onEscape();
      expect(component.mobileOpen()).toBe(false);
    });

    it('resize past breakpoint closes drawer', () => {
      const { component } = setup();
      component.openMobile();
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 1200,
      });
      component.onResize();
      expect(component.mobileOpen()).toBe(false);
    });

    it('resize below breakpoint keeps drawer open', () => {
      const { component } = setup();
      component.openMobile();
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 400,
      });
      component.onResize();
      expect(component.mobileOpen()).toBe(true);
    });

    it('NavigationEnd closes drawer', () => {
      const { component } = setup();
      component.openMobile();
      routerEvents.next(new NavigationEnd(1, '/boards', '/boards'));
      expect(component.mobileOpen()).toBe(false);
    });

    it('non-NavigationEnd events ignored', () => {
      const { component } = setup();
      component.openMobile();
      routerEvents.next({ id: 1 });
      expect(component.mobileOpen()).toBe(true);
    });
  });

  describe('language toggle', () => {
    it('switches vi → en', () => {
      const { component } = setup();
      component.toggleLang();
      expect(lang.setLanguage).toHaveBeenCalledWith('en');
    });

    it('switches en → vi', () => {
      const { component } = setup();
      lang.currentLang.set('en');
      component.toggleLang();
      expect(lang.setLanguage).toHaveBeenCalledWith('vi');
    });
  });

  describe('initials', () => {
    it('takes first letter of first two words', () => {
      const { component } = setup();
      expect(component.initials()).toBe('JD');
    });

    it('handles single-word name', () => {
      const { component } = setup();
      auth.currentUser.set({ name: 'Cher', email: 'c@e.com' });
      expect(component.initials()).toBe('C');
    });

    it('returns empty when no user', () => {
      const { component } = setup();
      auth.currentUser.set(null);
      expect(component.initials()).toBe('');
    });
  });
});
