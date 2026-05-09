import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: TranslateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
    });
    service = TestBed.inject(LanguageService);
    translate = TestBed.inject(TranslateService);
  });

  it('defaults to vi when no storage key', () => {
    expect(service.currentLang()).toBe('vi');
  });

  it('reads stored language from localStorage', () => {
    localStorage.setItem('pt_lang', 'en');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const s = TestBed.inject(LanguageService);
    expect(s.currentLang()).toBe('en');
  });

  it('falls back to vi for unknown stored value', () => {
    localStorage.setItem('pt_lang', 'fr');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const s = TestBed.inject(LanguageService);
    expect(s.currentLang()).toBe('vi');
  });

  it('init() configures translate service', () => {
    const addLangsSpy = vi.spyOn(translate, 'addLangs');
    const defaultLangSpy = vi.spyOn(translate, 'setDefaultLang');
    const useSpy = vi.spyOn(translate, 'use');

    service.init();

    expect(addLangsSpy).toHaveBeenCalledWith(['vi', 'en']);
    expect(defaultLangSpy).toHaveBeenCalledWith('vi');
    expect(useSpy).toHaveBeenCalledWith('vi');
  });

  it('setLanguage() updates signal, localStorage, and html lang', () => {
    const useSpy = vi.spyOn(translate, 'use');

    service.setLanguage('en');

    expect(service.currentLang()).toBe('en');
    expect(localStorage.getItem('pt_lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(useSpy).toHaveBeenCalledWith('en');
  });
});
