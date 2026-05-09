import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('defaults to dark when no storage key', () => {
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads dark from localStorage', () => {
    localStorage.setItem('pt_theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    expect(s.isDark()).toBe(true);
  });

  it('reads light from localStorage', () => {
    localStorage.setItem('pt_theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    expect(s.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggle() flips isDark and updates dom + storage', () => {
    expect(service.isDark()).toBe(true);

    service.toggle();

    expect(service.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('pt_theme')).toBe('light');
  });

  it('toggle() twice restores original state', () => {
    service.toggle();
    service.toggle();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
