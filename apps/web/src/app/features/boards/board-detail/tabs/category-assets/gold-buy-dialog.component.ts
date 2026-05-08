import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AssetDto, GoldBuyDto } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../../../core/board-api.service';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';

export interface GoldBuyDialogData {
  boardId: string;
  catId: string;
  asset: AssetDto;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gold-buy-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    VndCurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>Lịch sử mua vàng — {{ data.asset.name }}</h2>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <mat-dialog-content style="min-width:480px">
      <form [formGroup]="form" (ngSubmit)="addBuy()" class="buy-form">
        <mat-form-field appearance="outline" class="field-date">
          <mat-label>Ngày mua</mat-label>
          <input matInput type="date" formControlName="buyDate" [max]="today" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="field-chi">
          <mat-label>Số Chỉ</mat-label>
          <input
            matInput
            type="number"
            formControlName="chiAmount"
            min="0.0001"
            step="0.1"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" class="field-vnd">
          <mat-label>Số tiền (VND)</mat-label>
          <input matInput type="number" formControlName="amountVnd" min="1" />
        </mat-form-field>
        <button
          mat-flat-button
          type="submit"
          [disabled]="form.invalid || saving()"
        >
          <mat-icon>add</mat-icon> Thêm
        </button>
      </form>

      @if (buys().length > 0) {
        <table class="buy-table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số Chỉ</th>
              <th>Số tiền</th>
              <th>Giá/Chỉ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (buy of buys(); track buy.id) {
              @if (editingBuyId() === buy.id) {
                <tr>
                  <td>
                    <input
                      class="inline-input"
                      type="date"
                      [formControl]="editForm.controls.buyDate"
                      [max]="today"
                    />
                  </td>
                  <td>
                    <input
                      class="inline-input"
                      type="number"
                      [formControl]="editForm.controls.chiAmount"
                      min="0.0001"
                      step="0.1"
                    />
                  </td>
                  <td>
                    <input
                      class="inline-input"
                      type="number"
                      [formControl]="editForm.controls.amountVnd"
                      min="1"
                    />
                  </td>
                  <td>—</td>
                  <td style="white-space:nowrap">
                    <button
                      mat-icon-button
                      color="primary"
                      [disabled]="editForm.invalid || saving()"
                      (click)="saveBuyEdit(buy)"
                    >
                      <mat-icon>check</mat-icon>
                    </button>
                    <button mat-icon-button (click)="editingBuyId.set(null)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </td>
                </tr>
              } @else {
                <tr>
                  <td>{{ buy.buyDate }}</td>
                  <td>{{ buy.chiAmount | number: '1.0-4' }} Chỉ</td>
                  <td>{{ buy.amountVnd | vnd }}</td>
                  <td>{{ pricePerChi(buy) | vnd }}</td>
                  <td style="white-space:nowrap">
                    <button
                      mat-icon-button
                      (click)="startEditBuy(buy)"
                      [disabled]="saving()"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteBuy(buy)"
                      [disabled]="saving()"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>Tổng</td>
              <td>{{ totalChi() | number: '1.0-4' }} Chỉ</td>
              <td>{{ totalVnd() | vnd }}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      } @else if (!loading()) {
        <p class="empty-hint">Chưa có giao dịch mua nào.</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Đóng</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .buy-form {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        padding: 8px 0 16px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        margin-bottom: 16px;
      }
      .field-date {
        width: 150px;
      }
      .field-chi {
        width: 110px;
      }
      .field-vnd {
        flex: 1;
        min-width: 140px;
      }
      .buy-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      .buy-table th,
      .buy-table td {
        padding: 8px 10px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      .buy-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .buy-table td:not(:first-child),
      .buy-table th:not(:first-child) {
        text-align: right;
      }
      .total-row td {
        font-weight: 600;
        border-top: 2px solid var(--mat-sys-outline-variant);
        border-bottom: none;
      }
      .empty-hint {
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
        text-align: center;
        padding: 24px 0;
      }
      .inline-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--mat-sys-primary);
        outline: none;
        font-size: 14px;
        color: inherit;
        padding: 2px 0;
        text-align: inherit;
      }
    `,
  ],
})
export class GoldBuyDialogComponent implements OnInit {
  readonly data = inject<GoldBuyDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<GoldBuyDialogComponent>);
  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  readonly today = new Date().toISOString().slice(0, 10);

  loading = signal(true);
  saving = signal(false);
  buys = signal<GoldBuyDto[]>([]);
  changed = signal(false);
  editingBuyId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    buyDate: [this.today, Validators.required],
    chiAmount: [
      null as unknown as number,
      [Validators.required, Validators.min(0.0001)],
    ],
    amountVnd: [
      null as unknown as number,
      [Validators.required, Validators.min(1)],
    ],
  });

  editForm = this.fb.nonNullable.group({
    buyDate: [this.today, Validators.required],
    chiAmount: [
      null as unknown as number,
      [Validators.required, Validators.min(0.0001)],
    ],
    amountVnd: [
      null as unknown as number,
      [Validators.required, Validators.min(1)],
    ],
  });

  ngOnInit() {
    this.loadBuys();
  }

  loadBuys() {
    this.loading.set(true);
    this.api
      .listGoldBuys(this.data.boardId, this.data.catId, this.data.asset.id)
      .subscribe({
        next: (buys) => {
          this.buys.set(buys);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  addBuy() {
    if (this.form.invalid) return;
    const { buyDate, chiAmount, amountVnd } = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createGoldBuy(this.data.boardId, this.data.catId, this.data.asset.id, {
        buyDate,
        chiAmount,
        amountVnd,
      })
      .subscribe({
        next: (buy) => {
          this.buys.update((prev) =>
            [buy, ...prev].sort((a, b) => b.buyDate.localeCompare(a.buyDate)),
          );
          this.form.reset({
            buyDate: this.today,
            chiAmount: null as unknown as number,
            amountVnd: null as unknown as number,
          });
          this.saving.set(false);
          this.changed.set(true);
        },
        error: () => this.saving.set(false),
      });
  }

  startEditBuy(buy: GoldBuyDto) {
    this.editForm.setValue({
      buyDate: buy.buyDate,
      chiAmount: buy.chiAmount,
      amountVnd: buy.amountVnd,
    });
    this.editingBuyId.set(buy.id);
  }

  saveBuyEdit(buy: GoldBuyDto) {
    if (this.editForm.invalid) return;
    const { buyDate, chiAmount, amountVnd } = this.editForm.getRawValue();
    this.saving.set(true);
    this.api
      .updateGoldBuy(
        this.data.boardId,
        this.data.catId,
        this.data.asset.id,
        buy.id,
        { buyDate, chiAmount, amountVnd },
      )
      .subscribe({
        next: (updated) => {
          this.buys.update((prev) =>
            prev
              .map((b) => (b.id === updated.id ? updated : b))
              .sort((a, b) => b.buyDate.localeCompare(a.buyDate)),
          );
          this.editingBuyId.set(null);
          this.saving.set(false);
          this.changed.set(true);
        },
        error: () => this.saving.set(false),
      });
  }

  deleteBuy(buy: GoldBuyDto) {
    this.saving.set(true);
    this.api
      .deleteGoldBuy(
        this.data.boardId,
        this.data.catId,
        this.data.asset.id,
        buy.id,
      )
      .subscribe({
        next: () => {
          this.buys.update((prev) => prev.filter((b) => b.id !== buy.id));
          this.saving.set(false);
          this.changed.set(true);
        },
        error: () => this.saving.set(false),
      });
  }

  pricePerChi(buy: GoldBuyDto): number {
    return buy.chiAmount > 0 ? Math.round(buy.amountVnd / buy.chiAmount) : 0;
  }

  totalChi = () => this.buys().reduce((s, b) => s + b.chiAmount, 0);
  totalVnd = () => this.buys().reduce((s, b) => s + b.amountVnd, 0);

  close() {
    this.ref.close(this.changed());
  }
}
