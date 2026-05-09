import { VndCurrencyPipe } from './vnd-currency.pipe';

describe('VndCurrencyPipe', () => {
  const pipe = new VndCurrencyPipe();

  it('returns em-dash for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formats zero', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0');
    expect(result).toMatch(/₫|VND/);
  });

  it('formats positive integer', () => {
    const result = pipe.transform(1_000_000);
    expect(result).toContain('1.000.000');
  });

  it('formats large value', () => {
    const result = pipe.transform(100_000_000);
    expect(result).toContain('100.000.000');
  });

  it('formats negative value', () => {
    const result = pipe.transform(-500_000);
    expect(result).toContain('500.000');
    expect(result).toMatch(/-/);
  });
});
