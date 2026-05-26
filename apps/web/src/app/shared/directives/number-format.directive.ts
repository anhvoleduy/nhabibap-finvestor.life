import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appNumberFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberFormatDirective),
      multi: true,
    },
  ],
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
  },
})
export class NumberFormatDirective implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private onChange: (value: number | '') => void = () => {
    /* noop */
  };
  private onTouched: () => void = () => {
    /* noop */
  };

  writeValue(value: number | string | null): void {
    this.el.nativeElement.value = this.format(value);
  }

  registerOnChange(fn: (value: number | '') => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;

    const digits = raw.replace(/\D/g, '');
    const formatted = digits ? this.groupDigits(digits) : '';
    input.value = formatted;

    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(formatted[pos])) seen++;
      pos++;
    }
    input.setSelectionRange(pos, pos);

    this.onChange(digits ? Number(digits) : '');
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private format(value: number | string | null): string {
    if (value === null || value === undefined || value === '') return '';
    const digits = String(value).replace(/\D/g, '');
    return digits ? this.groupDigits(digits) : '';
  }

  private groupDigits(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
