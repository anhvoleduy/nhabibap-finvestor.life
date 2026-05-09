import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'pt_lang';
const SUPPORTED = ['vi', 'en'] as const;
type Lang = (typeof SUPPORTED)[number];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<Lang>(this.resolveInitial());

  init() {
    this.translate.addLangs([...SUPPORTED]);
    this.translate.setDefaultLang('vi');
    this.translate.use(this.currentLang());
  }

  setLanguage(lang: Lang) {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }

  private resolveInitial(): Lang {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored as Lang) ? (stored as Lang) : 'vi';
  }
}
