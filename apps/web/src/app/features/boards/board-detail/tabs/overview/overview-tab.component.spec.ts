import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import {
  AssetCategoryDto,
  CATEGORY_LABELS,
  CategoryType,
} from '@nhabibap-myportfolio/shared-types';
import { OverviewTabComponent } from './overview-tab.component';

function makeCategory(
  overrides: Partial<AssetCategoryDto> = {},
): AssetCategoryDto {
  return {
    id: 'cat-1',
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

function setup(
  categories: AssetCategoryDto[],
): {
  fixture: ComponentFixture<OverviewTabComponent>;
  component: OverviewTabComponent;
} {
  TestBed.configureTestingModule({
    imports: [OverviewTabComponent],
    providers: [provideTranslateService()],
  });
  const fixture = TestBed.createComponent(OverviewTabComponent);
  fixture.componentRef.setInput('categories', categories);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('OverviewTabComponent', () => {
  describe('totalCapital', () => {
    it('returns 0 for empty categories', () => {
      const { component } = setup([]);
      expect(component.totalCapital()).toBe(0);
    });

    it('sums totalCapital across categories', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 100 }),
        makeCategory({ id: '2', totalCapital: 200 }),
        makeCategory({ id: '3', totalCapital: 300 }),
      ]);
      expect(component.totalCapital()).toBe(600);
    });

    it('treats null totalCapital as 0', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 100 }),
        makeCategory({ id: '2', totalCapital: null }),
      ]);
      expect(component.totalCapital()).toBe(100);
    });
  });

  describe('totalValue', () => {
    it('returns 0 for empty categories', () => {
      const { component } = setup([]);
      expect(component.totalValue()).toBe(0);
    });

    it('sums totalValue across categories', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalValue: 150 }),
        makeCategory({ id: '2', totalValue: 250 }),
      ]);
      expect(component.totalValue()).toBe(400);
    });
  });

  describe('profit', () => {
    it('returns totalValue − totalCapital', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 100, totalValue: 150 }),
        makeCategory({ id: '2', totalCapital: 200, totalValue: 250 }),
      ]);
      expect(component.profit()).toBe(100);
    });

    it('returns negative when value < capital', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 1000, totalValue: 800 }),
      ]);
      expect(component.profit()).toBe(-200);
    });

    it('returns 0 when no categories', () => {
      const { component } = setup([]);
      expect(component.profit()).toBe(0);
    });
  });

  describe('profitPct', () => {
    it('returns 0 when totalCapital is 0', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 0, totalValue: 500 }),
      ]);
      expect(component.profitPct()).toBe(0);
    });

    it('computes (profit / totalCapital) * 100', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 1000, totalValue: 1200 }),
      ]);
      expect(component.profitPct()).toBe(20);
    });

    it('returns negative pct on loss', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: 1000, totalValue: 750 }),
      ]);
      expect(component.profitPct()).toBe(-25);
    });

    it('ignores null totalCapital in denominator', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalCapital: null, totalValue: 500 }),
      ]);
      expect(component.profitPct()).toBe(0);
    });
  });

  describe('chartData', () => {
    it('maps category labels from CATEGORY_LABELS', () => {
      const { component } = setup([
        makeCategory({ id: '1', type: CategoryType.GOLD }),
        makeCategory({ id: '2', type: CategoryType.CRYPTO }),
      ]);
      expect(component.chartData().labels).toEqual([
        CATEGORY_LABELS[CategoryType.GOLD],
        CATEGORY_LABELS[CategoryType.CRYPTO],
      ]);
    });

    it('maps totalValue to dataset data', () => {
      const { component } = setup([
        makeCategory({ id: '1', totalValue: 100 }),
        makeCategory({ id: '2', totalValue: 250 }),
      ]);
      expect(component.chartData().datasets[0].data).toEqual([100, 250]);
    });

    it('assigns one color per category', () => {
      const { component } = setup([
        makeCategory({ id: '1', type: CategoryType.GOLD }),
        makeCategory({ id: '2', type: CategoryType.SAVINGS }),
      ]);
      const colors = component.chartData().datasets[0].backgroundColor;
      expect(Array.isArray(colors)).toBe(true);
      expect((colors as string[]).length).toBe(2);
    });

    it('returns empty data arrays when no categories', () => {
      const { component } = setup([]);
      expect(component.chartData().labels).toEqual([]);
      expect(component.chartData().datasets[0].data).toEqual([]);
    });
  });
});
