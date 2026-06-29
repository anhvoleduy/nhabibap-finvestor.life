import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AssetDto, GoldBuyDto } from '@nhabibap-myportfolio/shared-types';
import {
  GoldBuyDialogComponent,
  GoldBuyDialogData,
} from './gold-buy-dialog.component';
import { BoardApiService } from '../../../../../core/board-api.service';

function makeAsset(): AssetDto {
  return {
    id: 'a1',
    categoryId: 'c1',
    name: 'SJC',
    capital: null,
    metadata: null,
    currentValue: null,
    profit: null,
    profitPct: null,
    lastEntryDate: null,
    totalChi: null,
  };
}

function makeBuy(overrides: Partial<GoldBuyDto> = {}): GoldBuyDto {
  return {
    id: 'g1',
    assetId: 'a1',
    buyDate: '2026-02-20',
    chiAmount: 1,
    amountVnd: 7000000,
    ...overrides,
  } as GoldBuyDto;
}

let api: {
  listGoldBuys: ReturnType<typeof vi.fn>;
  createGoldBuy: ReturnType<typeof vi.fn>;
  updateGoldBuy: ReturnType<typeof vi.fn>;
  deleteGoldBuy: ReturnType<typeof vi.fn>;
};

function setup(buys: GoldBuyDto[] = []) {
  api = {
    listGoldBuys: vi.fn().mockReturnValue(of(buys)),
    createGoldBuy: vi.fn().mockReturnValue(of(makeBuy({ id: 'new' }))),
    updateGoldBuy: vi.fn().mockReturnValue(of(makeBuy())),
    deleteGoldBuy: vi.fn().mockReturnValue(of(null)),
  };
  const data: GoldBuyDialogData = {
    boardId: 'b1',
    catId: 'c1',
    asset: makeAsset(),
  };

  TestBed.configureTestingModule({
    imports: [GoldBuyDialogComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture = TestBed.createComponent(GoldBuyDialogComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('GoldBuyDialogComponent', () => {
  it('defaults buyDate to a Date instance', () => {
    const { component } = setup();
    expect(component.form.controls.buyDate.value).toBeInstanceOf(Date);
  });

  it('sends ISO buyDate string to the API on add', () => {
    const { component } = setup();
    component.form.setValue({
      buyDate: new Date(2026, 0, 15),
      chiAmount: 2,
      amountVnd: 14000000,
    });

    component.addBuy();

    expect(api.createGoldBuy).toHaveBeenCalledWith('b1', 'c1', 'a1', {
      buyDate: '2026-01-15',
      chiAmount: 2,
      amountVnd: 14000000,
    });
  });

  it('parses ISO buyDate into a Date when editing', () => {
    const { component } = setup([makeBuy()]);
    component.startEditBuy(makeBuy({ buyDate: '2026-02-20' }));
    const v = component.editForm.controls.buyDate.value as Date;
    expect(v.getFullYear()).toBe(2026);
    expect(v.getMonth()).toBe(1);
    expect(v.getDate()).toBe(20);
  });

  it('sends ISO buyDate string to the API on edit save', () => {
    const buy = makeBuy();
    const { component } = setup([buy]);
    component.startEditBuy(buy);
    component.editForm.controls.buyDate.setValue(new Date(2026, 4, 9));

    component.saveBuyEdit(buy);

    expect(api.updateGoldBuy).toHaveBeenCalledWith(
      'b1',
      'c1',
      'a1',
      'g1',
      expect.objectContaining({ buyDate: '2026-05-09' }),
    );
  });
});
