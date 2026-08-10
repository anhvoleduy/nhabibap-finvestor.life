import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  AssetCategoryDto,
  AssetDto,
  BoardSummaryDto,
  CategoryType,
} from '@nhabibap-myportfolio/shared-types';
import { DcaCalendarComponent } from './dca-calendar.component';
import { BoardApiService } from '../../core/board-api.service';
import { LanguageService } from '../../core/language.service';

function makeBoard(overrides: Partial<BoardSummaryDto> = {}): BoardSummaryDto {
  return {
    id: 'b1',
    name: 'Main board',
    ownerId: 'u1',
    ownerName: 'Jane',
    role: 'OWNER',
    totalCapital: 0,
    totalValue: 0,
    profitPct: 0,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

function makeAsset(overrides: Partial<AssetDto> = {}): AssetDto {
  return {
    id: 'a1',
    categoryId: 'c1',
    name: 'VN30 ETF',
    capital: 1000,
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
  overrides: Partial<AssetCategoryDto> = {},
): AssetCategoryDto {
  return {
    id: 'c1',
    boardId: 'b1',
    type: CategoryType.ETF,
    label: 'ETF',
    assets: [],
    totalCapital: 0,
    totalValue: 0,
    profitPct: 0,
    ...overrides,
  };
}

let api: {
  listBoards: ReturnType<typeof vi.fn>;
  getCategories: ReturnType<typeof vi.fn>;
  updateAsset: ReturnType<typeof vi.fn>;
};

function setup() {
  TestBed.configureTestingModule({
    imports: [DcaCalendarComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
      {
        provide: LanguageService,
        useValue: { currentLang: signal<'vi' | 'en'>('en') },
      },
    ],
  });
  const fixture = TestBed.createComponent(DcaCalendarComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('DcaCalendarComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15)); // 2026-06-15, local time
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the empty state when no boards have reminders', () => {
    api = {
      listBoards: vi.fn().mockReturnValue(of([makeBoard()])),
      getCategories: vi.fn().mockReturnValue(of([makeCategory()])),
      updateAsset: vi.fn(),
    };
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('.cal-empty')).not.toBeNull();
  });

  it('rolls an overdue reminder onto today and flags it due', () => {
    const overdue = makeAsset({
      id: 'a-overdue',
      metadata: { dca: { frequency: 'WEEKLY', anchorDate: '2026-06-01' } },
    });
    api = {
      listBoards: vi.fn().mockReturnValue(of([makeBoard()])),
      getCategories: vi
        .fn()
        .mockReturnValue(of([makeCategory({ assets: [overdue] })])),
      updateAsset: vi.fn(),
    };
    const { component, fixture } = setup();

    const item = component.reminders()[0];
    expect(item.status).toBe('due');
    expect(item.effectiveDate).toBe('2026-06-15');

    const todayCell = fixture.nativeElement.querySelector('.cal-cell--today');
    expect(todayCell.querySelector('.cal-chip--due')).not.toBeNull();
    expect(todayCell.textContent).toContain('VN30 ETF');
  });

  it('places a not-yet-due reminder on its future scheduled date, not today', () => {
    const upcoming = makeAsset({
      id: 'a-upcoming',
      metadata: { dca: { frequency: 'WEEKLY', anchorDate: '2026-06-20' } },
    });
    api = {
      listBoards: vi.fn().mockReturnValue(of([makeBoard()])),
      getCategories: vi
        .fn()
        .mockReturnValue(of([makeCategory({ assets: [upcoming] })])),
      updateAsset: vi.fn(),
    };
    const { component } = setup();

    const item = component.reminders()[0];
    expect(item.status).toBe('upcoming');
    expect(item.effectiveDate).toBe('2026-06-20');
  });

  it('ignores assets without a dca schedule', () => {
    api = {
      listBoards: vi.fn().mockReturnValue(of([makeBoard()])),
      getCategories: vi
        .fn()
        .mockReturnValue(of([makeCategory({ assets: [makeAsset()] })])),
      updateAsset: vi.fn(),
    };
    const { component } = setup();
    expect(component.reminders()).toHaveLength(0);
  });

  it('markDone stamps lastDoneDate, merges metadata, and reloads', () => {
    const overdue = makeAsset({
      id: 'a-overdue',
      metadata: {
        note: 'keep me',
        dca: { frequency: 'WEEKLY', anchorDate: '2026-06-01' },
      },
    });
    api = {
      listBoards: vi.fn().mockReturnValue(of([makeBoard()])),
      getCategories: vi
        .fn()
        .mockReturnValue(of([makeCategory({ assets: [overdue] })])),
      updateAsset: vi.fn().mockReturnValue(of({})),
    };
    const { component, fixture } = setup();

    component.markDone(component.reminders()[0]);
    fixture.detectChanges();

    expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'a-overdue', {
      metadata: {
        note: 'keep me',
        dca: {
          frequency: 'WEEKLY',
          anchorDate: '2026-06-01',
          lastDoneDate: '2026-06-15',
        },
      },
    });
    expect(api.listBoards).toHaveBeenCalledTimes(2);
  });

  it('prevMonth/nextMonth/goToday move the visible month', () => {
    api = {
      listBoards: vi.fn().mockReturnValue(of([])),
      getCategories: vi.fn().mockReturnValue(of([])),
      updateAsset: vi.fn(),
    };
    const { component } = setup();

    const startMonth = component.viewMonth().getMonth();
    component.nextMonth();
    expect(component.viewMonth().getMonth()).toBe((startMonth + 1) % 12);

    component.prevMonth();
    expect(component.viewMonth().getMonth()).toBe(startMonth);

    component.nextMonth();
    component.goToday();
    expect(component.viewMonth().getMonth()).toBe(startMonth);
  });
});
