import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  AssetCategoryDto,
  AssetDto,
  CategoryType,
} from '@nhabibap-myportfolio/shared-types';
import { CategoryAssetsTabComponent } from './category-assets-tab.component';
import { BoardApiService } from '../../../../../core/board-api.service';

function makeAsset(overrides: Partial<AssetDto> = {}): AssetDto {
  return {
    id: 'a1',
    categoryId: 'c1',
    name: 'VN30',
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
  type: CategoryType,
  assets: AssetDto[] = [],
): AssetCategoryDto {
  return {
    id: 'c1',
    boardId: 'b1',
    type,
    label: type,
    assets,
    totalCapital: 0,
    totalValue: 0,
    profitPct: null,
  };
}

let api: {
  createAsset: ReturnType<typeof vi.fn>;
  updateAsset: ReturnType<typeof vi.fn>;
  deleteAsset: ReturnType<typeof vi.fn>;
};
let dialogOpenSpy: ReturnType<typeof vi.fn>;

function setup(
  category: AssetCategoryDto,
  closedValue: unknown = undefined,
): {
  fixture: ComponentFixture<CategoryAssetsTabComponent>;
  component: CategoryAssetsTabComponent;
  refreshed: ReturnType<typeof vi.fn>;
} {
  api = {
    createAsset: vi.fn().mockReturnValue(of({})),
    updateAsset: vi.fn().mockReturnValue(of({})),
    deleteAsset: vi.fn().mockReturnValue(of(null)),
  };

  dialogOpenSpy = vi.fn().mockReturnValue({
    afterClosed: () => of(closedValue),
  } as MatDialogRef<unknown>);
  vi.spyOn(MatDialog.prototype, 'open').mockImplementation(
    dialogOpenSpy as never,
  );

  TestBed.configureTestingModule({
    imports: [CategoryAssetsTabComponent],
    providers: [
      provideAnimationsAsync(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
    ],
  });

  const fixture = TestBed.createComponent(CategoryAssetsTabComponent);
  fixture.componentRef.setInput('boardId', 'b1');
  fixture.componentRef.setInput('category', category);
  const refreshed = vi.fn();
  fixture.componentInstance.refreshed.subscribe(refreshed);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, refreshed };
}

describe('CategoryAssetsTabComponent', () => {
  describe('isCash computed', () => {
    it('true for CASH category', () => {
      const { component } = setup(makeCategory(CategoryType.CASH));
      expect(component.isCash()).toBe(true);
    });

    it('false for non-CASH category', () => {
      const { component } = setup(makeCategory(CategoryType.ETF));
      expect(component.isCash()).toBe(false);
    });
  });

  describe('isGold computed', () => {
    it('true for GOLD category', () => {
      const { component } = setup(makeCategory(CategoryType.GOLD));
      expect(component.isGold()).toBe(true);
    });

    it('false for non-GOLD category', () => {
      const { component } = setup(makeCategory(CategoryType.ETF));
      expect(component.isGold()).toBe(false);
    });
  });

  describe('totalChi computed', () => {
    it('sums totalChi across all gold assets', () => {
      const assets = [
        makeAsset({ id: 'a1', totalChi: 1.5 }),
        makeAsset({ id: 'a2', totalChi: 2.25 }),
        makeAsset({ id: 'a3', totalChi: 0.5 }),
      ];
      const { component } = setup(makeCategory(CategoryType.GOLD, assets));
      expect(component.totalChi()).toBe(4.25);
    });

    it('treats null totalChi as 0', () => {
      const assets = [
        makeAsset({ id: 'a1', totalChi: 3 }),
        makeAsset({ id: 'a2', totalChi: null }),
      ];
      const { component } = setup(makeCategory(CategoryType.GOLD, assets));
      expect(component.totalChi()).toBe(3);
    });

    it('returns 0 when no assets', () => {
      const { component } = setup(makeCategory(CategoryType.GOLD, []));
      expect(component.totalChi()).toBe(0);
    });
  });

  describe('total chi stat card rendering', () => {
    it('renders extra stat card when GOLD', () => {
      const assets = [makeAsset({ totalChi: 1 })];
      const { fixture } = setup(makeCategory(CategoryType.GOLD, assets));
      const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
      expect(cards.length).toBe(4);
    });

    it('omits extra stat card when not GOLD', () => {
      const { fixture } = setup(makeCategory(CategoryType.ETF));
      const cards = fixture.nativeElement.querySelectorAll('app-stat-card');
      expect(cards.length).toBe(3);
    });
  });

  describe('addAsset', () => {
    it('skips when form invalid', () => {
      const { component } = setup(makeCategory(CategoryType.ETF));
      component.addAsset();
      expect(api.createAsset).not.toHaveBeenCalled();
    });

    it('omits capital for CASH category', () => {
      const { component, refreshed } = setup(makeCategory(CategoryType.CASH));
      component.addForm.setValue({ name: 'wallet', capital: 999 });

      component.addAsset();

      expect(api.createAsset).toHaveBeenCalledWith('b1', 'c1', {
        name: 'wallet',
      });
      expect(refreshed).toHaveBeenCalled();
    });

    it('includes capital for non-CASH category', () => {
      const { component } = setup(makeCategory(CategoryType.ETF));
      component.addForm.setValue({ name: 'VN30', capital: 5000 });

      component.addAsset();

      expect(api.createAsset).toHaveBeenCalledWith('b1', 'c1', {
        name: 'VN30',
        capital: 5000,
      });
    });
  });

  describe('startEditAsset', () => {
    it('disables capital control for CASH', () => {
      const asset = makeAsset({ capital: null });
      const { component } = setup(makeCategory(CategoryType.CASH, [asset]));
      component.startEditAsset(asset);
      expect(component.editForm.controls.capital.disabled).toBe(true);
    });

    it('disables capital control for GOLD (managed by history)', () => {
      const asset = makeAsset();
      const { component } = setup(makeCategory(CategoryType.GOLD, [asset]));
      component.startEditAsset(asset);
      expect(component.editForm.controls.capital.disabled).toBe(true);
    });

    it('disables capital control for CRYPTO', () => {
      const asset = makeAsset();
      const { component } = setup(makeCategory(CategoryType.CRYPTO, [asset]));
      component.startEditAsset(asset);
      expect(component.editForm.controls.capital.disabled).toBe(true);
    });

    it('enables capital control for ETF', () => {
      const asset = makeAsset();
      const { component } = setup(makeCategory(CategoryType.ETF, [asset]));
      component.startEditAsset(asset);
      expect(component.editForm.controls.capital.disabled).toBe(false);
      expect(component.editingAssetId()).toBe('a1');
    });
  });

  describe('saveAssetEdit', () => {
    it('skips when no editingAssetId', () => {
      const { component } = setup(makeCategory(CategoryType.ETF));
      component.saveAssetEdit();
      expect(api.updateAsset).not.toHaveBeenCalled();
    });

    it('sends name only for GOLD', () => {
      const asset = makeAsset({ id: 'g1' });
      const { component } = setup(makeCategory(CategoryType.GOLD, [asset]));
      component.startEditAsset(asset);
      component.editForm.patchValue({ name: 'SJC' });

      component.saveAssetEdit();

      expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'g1', {
        name: 'SJC',
      });
    });

    it('sends name + capital for ETF', () => {
      const asset = makeAsset({ id: 'e1' });
      const { component, refreshed } = setup(
        makeCategory(CategoryType.ETF, [asset]),
      );
      component.startEditAsset(asset);
      component.editForm.patchValue({ name: 'New', capital: 9999 });

      component.saveAssetEdit();

      expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'e1', {
        name: 'New',
        capital: 9999,
      });
      expect(component.editingAssetId()).toBeNull();
      expect(component.saving()).toBe(false);
      expect(refreshed).toHaveBeenCalled();
    });
  });

  describe('deleteAsset', () => {
    it('calls api.deleteAsset and emits refreshed', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.ETF, [asset]),
      );
      component.deleteAsset(asset);
      expect(api.deleteAsset).toHaveBeenCalledWith('b1', 'c1', 'a1');
      expect(refreshed).toHaveBeenCalled();
    });
  });

  describe('openGoldBuys / openCryptoBuys', () => {
    it('opens gold dialog and emits refreshed when changed=true', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.GOLD, [asset]),
        true,
      );
      component.openGoldBuys(asset);
      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(refreshed).toHaveBeenCalled();
    });

    it('does not emit refreshed when dialog returns false', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.GOLD, [asset]),
        false,
      );
      component.openGoldBuys(asset);
      expect(refreshed).not.toHaveBeenCalled();
    });

    it('opens crypto dialog and emits when changed=true', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.CRYPTO, [asset]),
        true,
      );
      component.openCryptoBuys(asset);
      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(refreshed).toHaveBeenCalled();
    });
  });

  describe('dcaInfo', () => {
    it('returns null when asset has no schedule', () => {
      const asset = makeAsset({ metadata: null });
      const { component } = setup(makeCategory(CategoryType.ETF, [asset]));
      expect(component.dcaInfo(asset)).toBeNull();
    });

    it('reports due status with overdue tooltip for a past schedule', () => {
      const asset = makeAsset({
        metadata: { dca: { frequency: 'WEEKLY', anchorDate: '2020-01-01' } },
      });
      const { component } = setup(makeCategory(CategoryType.ETF, [asset]));
      const info = component.dcaInfo(asset);
      expect(info?.status).toBe('due');
      expect(info?.next).toBe('2020-01-01');
      expect(info?.tooltip).toBe('DCA.OVERDUE_BY');
    });

    it('reports upcoming status with in-days tooltip for a future schedule', () => {
      const asset = makeAsset({
        metadata: { dca: { frequency: 'MONTHLY', anchorDate: '2999-01-01' } },
      });
      const { component } = setup(makeCategory(CategoryType.ETF, [asset]));
      const info = component.dcaInfo(asset);
      expect(info?.status).toBe('upcoming');
      expect(info?.tooltip).toBe('DCA.IN_DAYS');
    });
  });

  describe('openDcaSchedule', () => {
    it('opens dialog and emits refreshed when changed=true', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.GOLD, [asset]),
        true,
      );
      component.openDcaSchedule(asset);
      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(refreshed).toHaveBeenCalled();
    });

    it('does not emit refreshed when dialog returns false', () => {
      const asset = makeAsset();
      const { component, refreshed } = setup(
        makeCategory(CategoryType.OPEN_FUND, [asset]),
        false,
      );
      component.openDcaSchedule(asset);
      expect(refreshed).not.toHaveBeenCalled();
    });
  });
});
