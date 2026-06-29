import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AssetDto } from '@nhabibap-myportfolio/shared-types';
import {
  DcaScheduleDialogComponent,
  DcaScheduleDialogData,
} from './dca-schedule-dialog.component';
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

let api: { updateAsset: ReturnType<typeof vi.fn> };
let dialogRef: { close: ReturnType<typeof vi.fn> };

function setup(asset: AssetDto) {
  api = { updateAsset: vi.fn().mockReturnValue(of({})) };
  dialogRef = { close: vi.fn() };
  const data: DcaScheduleDialogData = { boardId: 'b1', catId: 'c1', asset };

  TestBed.configureTestingModule({
    imports: [DcaScheduleDialogComponent],
    providers: [
      provideAnimationsAsync(),
      provideTranslateService(),
      { provide: BoardApiService, useValue: api },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture = TestBed.createComponent(DcaScheduleDialogComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('DcaScheduleDialogComponent', () => {
  it('defaults to MONTHLY with no existing schedule', () => {
    const { component } = setup(makeAsset());
    expect(component.hasExisting()).toBe(false);
    expect(component.form.controls.frequency.value).toBe('MONTHLY');
  });

  it('prefills from an existing schedule', () => {
    const { component } = setup(
      makeAsset({
        metadata: {
          dca: {
            frequency: 'WEEKLY',
            anchorDate: '2026-01-10',
            lastDoneDate: '2026-01-17',
          },
        },
      }),
    );
    expect(component.hasExisting()).toBe(true);
    expect(component.form.controls.frequency.value).toBe('WEEKLY');
    const anchor = component.form.controls.anchorDate.value as Date;
    expect(anchor.getFullYear()).toBe(2026);
    expect(anchor.getMonth()).toBe(0);
    expect(anchor.getDate()).toBe(10);
    expect(component.lastDoneDate()).toBe('2026-01-17');
  });

  it('saves a merged metadata payload and closes with true', () => {
    const { component } = setup(makeAsset({ metadata: { note: 'keep me' } }));
    component.form.patchValue({
      frequency: 'QUARTERLY',
      anchorDate: new Date(2026, 2, 1),
    });

    component.save();

    expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'a1', {
      metadata: {
        note: 'keep me',
        dca: { frequency: 'QUARTERLY', anchorDate: '2026-03-01' },
      },
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('includes intervalDays only for CUSTOM frequency', () => {
    const { component } = setup(makeAsset());
    component.form.patchValue({
      frequency: 'CUSTOM',
      intervalDays: 10,
      anchorDate: new Date(2026, 0, 1),
    });

    component.save();

    expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'a1', {
      metadata: {
        dca: {
          frequency: 'CUSTOM',
          anchorDate: '2026-01-01',
          intervalDays: 10,
        },
      },
    });
  });

  it('markDoneToday stamps lastDoneDate into the saved schedule', () => {
    const { component } = setup(makeAsset());
    component.form.patchValue({
      frequency: 'WEEKLY',
      anchorDate: new Date(2026, 0, 1),
    });

    component.markDoneToday();
    component.save();

    const payload = api.updateAsset.mock.calls[0][3].metadata.dca;
    expect(payload.lastDoneDate).toBe(component.today);
  });

  it('remove strips the dca key but keeps other metadata', () => {
    const { component } = setup(
      makeAsset({
        metadata: {
          note: 'keep me',
          dca: { frequency: 'WEEKLY', anchorDate: '2026-01-01' },
        },
      }),
    );

    component.remove();

    expect(api.updateAsset).toHaveBeenCalledWith('b1', 'c1', 'a1', {
      metadata: { note: 'keep me' },
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('close emits false', () => {
    const { component } = setup(makeAsset());
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});
