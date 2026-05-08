import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'pt_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(
    localStorage.getItem(THEME_KEY)
      ? localStorage.getItem(THEME_KEY) === 'dark'
      : true,
  );

  constructor() {
    this.applyTheme(this.isDark());
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    this.applyTheme(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean) {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light',
    );
  }
}
