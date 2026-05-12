import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

function setup(inputs: {
  label: string;
  value: number | null;
  isPercent?: boolean;
  unit?: string;
  valueClass?: string;
}): {
  fixture: ComponentFixture<StatCardComponent>;
  el: HTMLElement;
} {
  TestBed.configureTestingModule({ imports: [StatCardComponent] });
  const fixture = TestBed.createComponent(StatCardComponent);
  fixture.componentRef.setInput('label', inputs.label);
  fixture.componentRef.setInput('value', inputs.value);
  if (inputs.isPercent !== undefined)
    fixture.componentRef.setInput('isPercent', inputs.isPercent);
  if (inputs.unit !== undefined)
    fixture.componentRef.setInput('unit', inputs.unit);
  if (inputs.valueClass !== undefined)
    fixture.componentRef.setInput('valueClass', inputs.valueClass);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('StatCardComponent', () => {
  it('renders label', () => {
    const { el } = setup({ label: 'Total', value: 0 });
    expect(el.querySelector('.stat-card__label')?.textContent).toContain(
      'Total',
    );
  });

  describe('default (VND) mode', () => {
    it('formats value as VND when unit and isPercent are absent', () => {
      const { el } = setup({ label: 'Cap', value: 1000000 });
      const text = el.querySelector('.value-text')?.textContent ?? '';
      expect(text).toMatch(/1[.\s,]?000[.\s,]?000/);
      expect(text).toMatch(/₫|VND/);
    });

    it('renders em dash for null value', () => {
      const { el } = setup({ label: 'Cap', value: null });
      const text = el.querySelector('.value-text')?.textContent?.trim();
      expect(text).toBe('—');
    });
  });

  describe('percent mode', () => {
    it('formats value with 2 decimals and percent sign', () => {
      const { el } = setup({ label: 'Pct', value: 12.345, isPercent: true });
      const text = el.querySelector('.value-text')?.textContent ?? '';
      expect(text).toContain('12.35%');
    });

    it('shows trending_up icon for positive value', () => {
      const { el } = setup({ label: 'Pct', value: 5, isPercent: true });
      const icon = el.querySelector('.trend-icon')?.textContent?.trim();
      expect(icon).toBe('trending_up');
    });

    it('shows trending_down icon for negative value', () => {
      const { el } = setup({ label: 'Pct', value: -3, isPercent: true });
      const icon = el.querySelector('.trend-icon')?.textContent?.trim();
      expect(icon).toBe('trending_down');
    });

    it('hides trend icon when value is null', () => {
      const { el } = setup({ label: 'Pct', value: null, isPercent: true });
      expect(el.querySelector('.trend-icon')).toBeNull();
    });
  });

  describe('unit mode', () => {
    it('renders decimal value with unit suffix', () => {
      const { el } = setup({ label: 'Bought', value: 4.25, unit: 'Chỉ' });
      const text = el.querySelector('.value-text')?.textContent ?? '';
      expect(text).toContain('4.25');
      expect(text).toContain('Chỉ');
    });

    it('formats integer values without trailing zeros', () => {
      const { el } = setup({ label: 'Bought', value: 7, unit: 'Chỉ' });
      const text = el.querySelector('.value-text')?.textContent ?? '';
      expect(text).toContain('7');
      expect(text).not.toContain('7.0');
    });

    it('does not render VND or percent when unit is set', () => {
      const { el } = setup({ label: 'Bought', value: 1, unit: 'Chỉ' });
      const text = el.querySelector('.value-text')?.textContent ?? '';
      expect(text).not.toMatch(/₫|VND|%/);
    });
  });

  describe('valueClass', () => {
    it('applies provided class to value container', () => {
      const { el } = setup({
        label: 'Pct',
        value: 5,
        isPercent: true,
        valueClass: 'positive',
      });
      expect(
        el.querySelector('.stat-card__value')?.classList.contains('positive'),
      ).toBe(true);
    });
  });
});
