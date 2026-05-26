import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NavSnapshotDto } from '@nhabibap-myportfolio/shared-types';
import { NavTabComponent } from './nav-tab.component';
import { BoardApiService } from '../../../../../core/board-api.service';

function makeSnap(overrides: Partial<NavSnapshotDto> = {}): NavSnapshotDto {
  return {
    id: 's1',
    boardId: 'b1',
    snapshotDate: '2026-01-31',
    totalCapital: 1000,
    totalValue: 1100,
    profit: 100,
    profitPct: 10,
    periodGrowth: 10,
    ...overrides,
  };
}

let api: {
  getNav: ReturnType<typeof vi.fn>;
  upsertManualNav: ReturnType<typeof vi.fn>;
  deleteNav: ReturnType<typeof vi.fn>;
};

function setup(
  snaps: NavSnapshotDto[] = [],
  overrides: Partial<typeof api> = {},
): {
  fixture: ComponentFixture<NavTabComponent>;
  component: NavTabComponent;
} {
  api = {
    getNav: vi.fn().mockReturnValue(of(snaps)),
    upsertManualNav: vi.fn().mockReturnValue(of(makeSnap())),
    deleteNav: vi.fn().mockReturnValue(of(null)),
    ...overrides,
  };

  TestBed.configureTestingModule({
    imports: [NavTabComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
    ],
  });
  const fixture = TestBed.createComponent(NavTabComponent);
  fixture.componentRef.setInput('boardId', 'b1');
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('NavTabComponent', () => {
  describe('formatPeriod', () => {
    it('formats yearly as just year', () => {
      const { component } = setup();
      component.granularity.set('yearly');
      expect(component.formatPeriod('2026-05-15')).toBe('2026');
    });

    it('formats monthly as T{month}/{year}', () => {
      const { component } = setup();
      component.granularity.set('monthly');
      expect(component.formatPeriod('2026-05-15')).toBe('T5/2026');
    });

    it('formats quarterly Q1 for Jan-Mar', () => {
      const { component } = setup();
      component.granularity.set('quarterly');
      expect(component.formatPeriod('2026-02-15')).toBe('Q1/2026');
    });

    it('formats quarterly Q2 for Apr-Jun', () => {
      const { component } = setup();
      component.granularity.set('quarterly');
      expect(component.formatPeriod('2026-06-30')).toBe('Q2/2026');
    });

    it('formats quarterly Q4 for Oct-Dec', () => {
      const { component } = setup();
      component.granularity.set('quarterly');
      expect(component.formatPeriod('2026-12-01')).toBe('Q4/2026');
    });

    it('handles quarter boundary March (Q1)', () => {
      const { component } = setup();
      component.granularity.set('quarterly');
      expect(component.formatPeriod('2026-03-31')).toBe('Q1/2026');
    });

    it('handles quarter boundary April (Q2)', () => {
      const { component } = setup();
      component.granularity.set('quarterly');
      expect(component.formatPeriod('2026-04-01')).toBe('Q2/2026');
    });
  });

  describe('reversedSnapshots', () => {
    it('returns empty for empty snapshots', () => {
      const { component } = setup([]);
      expect(component.reversedSnapshots()).toEqual([]);
    });

    it('reverses snapshot order without mutating source', () => {
      const snaps = [
        makeSnap({ id: 's1', snapshotDate: '2026-01-31' }),
        makeSnap({ id: 's2', snapshotDate: '2026-02-28' }),
        makeSnap({ id: 's3', snapshotDate: '2026-03-31' }),
      ];
      const { component } = setup(snaps);
      expect(component.reversedSnapshots().map((s) => s.id)).toEqual([
        's3',
        's2',
        's1',
      ]);
      expect(component.snapshots().map((s) => s.id)).toEqual([
        's1',
        's2',
        's3',
      ]);
    });

    it('computes growthAmount as diff vs previous period (null for first)', () => {
      const snaps = [
        makeSnap({ id: 's1', snapshotDate: '2026-01-31', totalValue: 1000 }),
        makeSnap({ id: 's2', snapshotDate: '2026-02-28', totalValue: 1500 }),
        makeSnap({ id: 's3', snapshotDate: '2026-03-31', totalValue: 1200 }),
      ];
      const { component } = setup(snaps);
      const rev = component.reversedSnapshots();
      expect(rev.map((s) => s.growthAmount)).toEqual([-300, 500, null]);
    });
  });

  describe('load', () => {
    it('calls api.getNav with current granularity', () => {
      const { component } = setup([makeSnap()]);
      expect(api.getNav).toHaveBeenCalledWith(
        'b1',
        undefined,
        undefined,
        'monthly',
      );
      expect(component.snapshots().length).toBe(1);
    });

    it('reloads with new granularity on setGranularity', () => {
      const { component } = setup([]);
      api.getNav.mockClear();
      component.setGranularity('quarterly');
      expect(component.granularity()).toBe('quarterly');
      expect(api.getNav).toHaveBeenCalledWith(
        'b1',
        undefined,
        undefined,
        'quarterly',
      );
    });
  });

  describe('startEdit / cancelEdit / setEditValue', () => {
    it('startEdit populates editingId + editValue from snap', () => {
      const snap = makeSnap({
        id: 's1',
        snapshotDate: '2026-04-30',
        totalValue: 5000,
        totalCapital: 4000,
      });
      const { component } = setup([snap]);
      component.startEdit(snap);
      expect(component.editingId()).toBe('s1');
      expect(component.editValue()).toEqual({
        date: '2026-04-30',
        totalValue: 5000,
        totalCapital: 4000,
      });
    });

    it('cancelEdit clears editingId', () => {
      const { component } = setup([]);
      component.editingId.set('s1');
      component.cancelEdit();
      expect(component.editingId()).toBeNull();
    });

    it('setEditDate updates date field only', () => {
      const { component } = setup([]);
      component.editValue.set({
        date: '2026-01-01',
        totalValue: 100,
        totalCapital: 50,
      });
      component.setEditDate({
        target: { value: '2026-02-01' },
      } as unknown as Event);
      expect(component.editValue()).toEqual({
        date: '2026-02-01',
        totalValue: 100,
        totalCapital: 50,
      });
    });

    it('setEditValue coerces input to number for totalValue', () => {
      const { component } = setup([]);
      component.editValue.set({ date: 'd', totalValue: 0, totalCapital: 0 });
      component.setEditValue('totalValue', {
        target: { value: '1234' },
      } as unknown as Event);
      expect(component.editValue().totalValue).toBe(1234);
    });
  });

  describe('saveEdit', () => {
    it('upserts in place when date unchanged', () => {
      const snap = makeSnap({ id: 's1', snapshotDate: '2026-01-31' });
      const { component } = setup([snap]);
      component.editValue.set({
        date: '2026-01-31',
        totalValue: 9999,
        totalCapital: 1000,
      });
      component.editingId.set('s1');

      component.saveEdit(snap);

      expect(api.deleteNav).not.toHaveBeenCalled();
      expect(api.upsertManualNav).toHaveBeenCalledWith('b1', {
        date: '2026-01-31',
        totalValue: 9999,
        totalCapital: 1000,
      });
      expect(component.editingId()).toBeNull();
    });

    it('deletes old then upserts when date changed', () => {
      const snap = makeSnap({ id: 's1', snapshotDate: '2026-01-31' });
      const { component } = setup([snap]);
      component.editValue.set({
        date: '2026-02-28',
        totalValue: 9999,
        totalCapital: 1000,
      });
      component.editingId.set('s1');

      component.saveEdit(snap);

      expect(api.deleteNav).toHaveBeenCalledWith('b1', 's1');
      expect(api.upsertManualNav).toHaveBeenCalledWith('b1', {
        date: '2026-02-28',
        totalValue: 9999,
        totalCapital: 1000,
      });
      expect(component.editingId()).toBeNull();
    });
  });

  describe('deleteSnapshot', () => {
    it('calls api.deleteNav then reloads', () => {
      const snap = makeSnap({ id: 's1' });
      const { component } = setup([snap]);
      api.getNav.mockClear();
      component.deleteSnapshot(snap);
      expect(api.deleteNav).toHaveBeenCalledWith('b1', 's1');
      expect(api.getNav).toHaveBeenCalled();
    });
  });

  describe('submitManual', () => {
    it('aborts when form invalid', () => {
      const { component } = setup([]);
      component.submitManual();
      expect(api.upsertManualNav).not.toHaveBeenCalled();
    });

    it('omits totalCapital when null', () => {
      const { component } = setup([]);
      component.addForm.setValue({
        date: '2026-05-01',
        totalValue: 5000,
        totalCapital: null,
      });

      component.submitManual();

      expect(api.upsertManualNav).toHaveBeenCalledWith('b1', {
        date: '2026-05-01',
        totalValue: 5000,
      });
    });

    it('includes totalCapital when provided', () => {
      const { component } = setup([]);
      component.addForm.setValue({
        date: '2026-05-01',
        totalValue: 5000,
        totalCapital: 4000,
      });

      component.submitManual();

      expect(api.upsertManualNav).toHaveBeenCalledWith('b1', {
        date: '2026-05-01',
        totalValue: 5000,
        totalCapital: 4000,
      });
    });

    it('hides form + resets after success', () => {
      const { component } = setup([]);
      component.showAddForm.set(true);
      component.addForm.setValue({
        date: '2026-05-01',
        totalValue: 5000,
        totalCapital: null,
      });

      component.submitManual();

      expect(component.showAddForm()).toBe(false);
      expect(component.addForm.value.date).toBeFalsy();
    });

    it('rejects invalid date pattern', () => {
      const { component } = setup([]);
      component.addForm.setValue({
        date: 'not-a-date',
        totalValue: 5000,
        totalCapital: null,
      });
      component.submitManual();
      expect(api.upsertManualNav).not.toHaveBeenCalled();
    });
  });

  describe('chartData', () => {
    it('maps labels via formatPeriod for current granularity', () => {
      const { component } = setup([
        makeSnap({ id: 's1', snapshotDate: '2026-01-31' }),
        makeSnap({ id: 's2', snapshotDate: '2026-02-28' }),
      ]);
      expect(component.chartData().labels).toEqual(['T1/2026', 'T2/2026']);
    });

    it('first dataset holds totalValue', () => {
      const { component } = setup([
        makeSnap({ id: 's1', totalValue: 100 }),
        makeSnap({ id: 's2', totalValue: 200 }),
      ]);
      expect(component.chartData().datasets[0].data).toEqual([100, 200]);
    });

    it('second dataset holds periodGrowth with null → 0', () => {
      const { component } = setup([
        makeSnap({ id: 's1', periodGrowth: 5 }),
        makeSnap({ id: 's2', periodGrowth: null }),
      ]);
      expect(component.chartData().datasets[1].data).toEqual([5, 0]);
    });
  });
});
