import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AssetDto, CryptoBuyDto } from '@nhabibap-myportfolio/shared-types';
import {
  CryptoBuyDialogComponent,
  CryptoBuyDialogData,
} from './crypto-buy-dialog.component';
import { BoardApiService } from '../../../../../core/board-api.service';

function makeAsset(): AssetDto {
  return {
    id: 'a1',
    categoryId: 'c1',
    name: 'BTC',
    capital: null,
    metadata: null,
    currentValue: null,
    profit: null,
    profitPct: null,
    lastEntryDate: null,
    totalChi: null,
  };
}

function makeBuy(overrides: Partial<CryptoBuyDto> = {}): CryptoBuyDto {
  return {
    id: 'cb1',
    assetId: 'a1',
    buyDate: '2026-02-20',
    amountVnd: 5000000,
    ...overrides,
  } as CryptoBuyDto;
}

let api: {
  listCryptoBuys: ReturnType<typeof vi.fn>;
  createCryptoBuy: ReturnType<typeof vi.fn>;
  updateCryptoBuy: ReturnType<typeof vi.fn>;
  deleteCryptoBuy: ReturnType<typeof vi.fn>;
};

function setup(buys: CryptoBuyDto[] = []) {
  api = {
    listCryptoBuys: vi.fn().mockReturnValue(of(buys)),
    createCryptoBuy: vi.fn().mockReturnValue(of(makeBuy({ id: 'new' }))),
    updateCryptoBuy: vi.fn().mockReturnValue(of(makeBuy())),
    deleteCryptoBuy: vi.fn().mockReturnValue(of(null)),
  };
  const data: CryptoBuyDialogData = {
    boardId: 'b1',
    catId: 'c1',
    asset: makeAsset(),
  };

  TestBed.configureTestingModule({
    imports: [CryptoBuyDialogComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture = TestBed.createComponent(CryptoBuyDialogComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('CryptoBuyDialogComponent', () => {
  it('defaults buyDate to a Date instance', () => {
    const { component } = setup();
    expect(component.form.controls.buyDate.value).toBeInstanceOf(Date);
  });

  it('sends ISO buyDate string to the API on add', () => {
    const { component } = setup();
    component.form.setValue({
      buyDate: new Date(2026, 0, 15),
      amountVnd: 3000000,
    });

    component.addBuy();

    expect(api.createCryptoBuy).toHaveBeenCalledWith('b1', 'c1', 'a1', {
      buyDate: '2026-01-15',
      amountVnd: 3000000,
    });
  });

  it('parses ISO buyDate into a Date when editing', () => {
    const buy = makeBuy({ buyDate: '2026-02-20' });
    const { component } = setup([buy]);
    component.startEditBuy(buy);
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

    expect(api.updateCryptoBuy).toHaveBeenCalledWith(
      'b1',
      'c1',
      'a1',
      'cb1',
      expect.objectContaining({ buyDate: '2026-05-09' }),
    );
  });
});
