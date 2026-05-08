import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { DailyEntryComponent } from './daily-entry.component';
import { BoardApiService } from '../../../core/board-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AssetCategoryDto,
  AssetDto,
  AssetEntryDto,
  CategoryType,
  DailyEntriesDto,
} from '@nhabibap-myportfolio/shared-types';

// ── factories ────────────────────────────────────────────────────────────────

function makeAsset(overrides: Partial<AssetDto> = {}): AssetDto {
  return {
    id: 'asset-1',
    categoryId: 'cat-1',
    name: 'VN30',
    capital: 10_000_000,
    metadata: null,
    currentValue: null,
    profit: null,
    profitPct: null,
    lastEntryDate: null,
    totalChi: null,
    ...overrides,
  };
}

function makeCategory(
  type: CategoryType,
  assets: AssetDto[],
): AssetCategoryDto {
  return {
    id: 'cat-1',
    boardId: 'board-1',
    type,
    label: type,
    assets,
    totalCapital: 0,
    totalValue: 0,
    profitPct: 0,
  };
}

function makeEntry(
  assetId: string,
  currentValue: number,
): Partial<AssetEntryDto> {
  return {
    id: 'e-1',
    assetId,
    currentValue,
    entryDate: '2026-05-07',
    notes: null,
    assetName: 'VN30',
    createdBy: 'u1',
  };
}

function emptyDailyEntries(date = '2026-05-08'): DailyEntriesDto {
  return { date, entries: [] };
}

// ── setup helper ─────────────────────────────────────────────────────────────

function setup(apiOverrides: Partial<typeof api> = {}) {
  api = {
    getCategories: vi.fn().mockReturnValue(of([])),
    getLatestEntries: vi.fn().mockReturnValue(of([])),
    getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
    submitEntries: vi.fn().mockReturnValue(of(emptyDailyEntries())),
    ...apiOverrides,
  };

  TestBed.configureTestingModule({
    imports: [DailyEntryComponent],
    providers: [
      provideRouter([]),
      provideAnimationsAsync(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => 'board-1' } } },
      },
      { provide: BoardApiService, useValue: api },
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
    ],
  });

  fixture = TestBed.createComponent(DailyEntryComponent);
  component = fixture.componentInstance;
}

let fixture: ComponentFixture<DailyEntryComponent>;
let component: DailyEntryComponent;
let api: {
  getCategories: ReturnType<typeof vi.fn>;
  getLatestEntries: ReturnType<typeof vi.fn>;
  getEntriesForDate: ReturnType<typeof vi.fn>;
  submitEntries: ReturnType<typeof vi.fn>;
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DailyEntryComponent', () => {
  describe('prefill — ETF/CRYPTO/CASH/OPEN_FUND (direct value)', () => {
    it('prefills from dateEntry when entry exists for selected date', () => {
      const asset = makeAsset({ id: 'a1', capital: 10_000_000 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi
          .fn()
          .mockReturnValue(
            of({ date: '2026-05-08', entries: [makeEntry('a1', 50_000_000)] }),
          ),
      });

      fixture.detectChanges();

      expect(component.form.get('a1')?.value).toBe(50_000_000);
    });

    it('falls back to lastValue when no dateEntry exists', () => {
      const asset = makeAsset({ id: 'a1', capital: 10_000_000 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('a1', 48_000_000)])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.form.get('a1')?.value).toBe(48_000_000);
    });

    it('leaves field empty when neither dateEntry nor lastValue exists', () => {
      const asset = makeAsset({ id: 'a1' });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.form.get('a1')?.value).toBe('');
    });

    it('dateEntry takes priority over lastValue', () => {
      const asset = makeAsset({ id: 'a1' });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('a1', 48_000_000)])),
        getEntriesForDate: vi
          .fn()
          .mockReturnValue(
            of({ date: '2026-05-08', entries: [makeEntry('a1', 50_000_000)] }),
          ),
      });

      fixture.detectChanges();

      expect(component.form.get('a1')?.value).toBe(50_000_000);
    });
  });

  describe('prefill — GOLD (price per chi)', () => {
    it('prefills price/chi from dateEntry: value ÷ totalChi', () => {
      const asset = makeAsset({ id: 'g1', totalChi: 2.5 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.GOLD, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi
          .fn()
          .mockReturnValue(
            of({ date: '2026-05-08', entries: [makeEntry('g1', 50_000_000)] }),
          ),
      });

      fixture.detectChanges();

      // 50_000_000 / 2.5 = 20_000_000
      expect(component.form.get('g1')?.value).toBe(20_000_000);
    });

    it('falls back to price/chi from lastValue when no dateEntry', () => {
      const asset = makeAsset({ id: 'g1', totalChi: 2.5 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.GOLD, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('g1', 45_000_000)])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      // 45_000_000 / 2.5 = 18_000_000
      expect(component.form.get('g1')?.value).toBe(18_000_000);
    });

    it('stores raw currentValue when totalChi is 0 (chi condition not met)', () => {
      // totalChi=0 fails the `row.totalChi && row.totalChi > 0` guard,
      // so prefill falls through to the else branch and stores currentValue as-is.
      // The template hides the input field for this case anyway.
      const asset = makeAsset({ id: 'g1', totalChi: 0 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.GOLD, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('g1', 45_000_000)])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.form.get('g1')?.value).toBe(45_000_000);
    });
  });

  describe('prefill — SAVINGS (interest = value − capital)', () => {
    it('prefills interest from dateEntry: value − capital', () => {
      const asset = makeAsset({ id: 's1', capital: 100_000_000 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.SAVINGS, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi
          .fn()
          .mockReturnValue(
            of({ date: '2026-05-08', entries: [makeEntry('s1', 105_000_000)] }),
          ),
      });

      fixture.detectChanges();

      expect(component.form.get('s1')?.value).toBe(5_000_000);
    });

    it('falls back to interest from lastValue when no dateEntry', () => {
      const asset = makeAsset({ id: 's1', capital: 100_000_000 });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.SAVINGS, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('s1', 103_000_000)])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.form.get('s1')?.value).toBe(3_000_000);
    });
  });

  describe('formValues signal', () => {
    it('initializes formValues from form on load', () => {
      const asset = makeAsset({ id: 'a1' });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi
          .fn()
          .mockReturnValue(of([makeEntry('a1', 50_000_000)])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.formValues()['a1']).toBe(50_000_000);
    });

    it('updates formValues signal when user changes input', () => {
      const asset = makeAsset({ id: 'a1' });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      component.form.get('a1')?.setValue(99_000_000);

      expect(component.formValues()['a1']).toBe(99_000_000);
    });

    it('resets formValues on date change', () => {
      const asset = makeAsset({ id: 'a1' });
      const getEntriesForDate = vi
        .fn()
        .mockReturnValueOnce(
          of({ date: '2026-05-07', entries: [makeEntry('a1', 40_000_000)] }),
        )
        .mockReturnValueOnce(of(emptyDailyEntries('2026-05-08')));

      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(of([makeCategory(CategoryType.ETF, [asset])])),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate,
      });

      fixture.detectChanges();
      expect(component.formValues()['a1']).toBe(40_000_000);

      component.selectedDate.set('2026-05-08');
      component.load();
      fixture.detectChanges();

      expect(component.formValues()['a1']).toBe('');
    });
  });

  describe('load()', () => {
    it('sets loading false on success', () => {
      setup();
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('sets loading false on API error', () => {
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(throwError(() => new Error('fail'))),
      });
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('groups assetRows by category label', () => {
      const etfAsset = makeAsset({ id: 'e1' });
      const cashAsset = makeAsset({ id: 'c1', categoryId: 'cat-2' });
      setup({
        getCategories: vi
          .fn()
          .mockReturnValue(
            of([
              makeCategory(CategoryType.ETF, [etfAsset]),
              { ...makeCategory(CategoryType.CASH, [cashAsset]), id: 'cat-2' },
            ]),
          ),
        getLatestEntries: vi.fn().mockReturnValue(of([])),
        getEntriesForDate: vi.fn().mockReturnValue(of(emptyDailyEntries())),
      });

      fixture.detectChanges();

      expect(component.groupedRows().length).toBe(2);
    });
  });
});
