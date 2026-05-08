import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CashFlowEntryDto, FlowType } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../../../core/board-api.service';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cash-flow-tab',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    VndCurrencyPipe,
  ],
  template: `
    <div class="cf-tab">
      <!-- Wallet section -->
      <div class="wallet-section">
        <h3 class="section-title">Số dư hiện tại</h3>
        <form
          [formGroup]="walletForm"
          (ngSubmit)="saveWallet()"
          class="wallet-form"
        >
          <mat-form-field appearance="outline">
            <mat-label>Tiền ngân hàng</mat-label>
            <input
              matInput
              type="number"
              formControlName="bankBalance"
              [readonly]="!canEdit()"
            />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tiền mặt</mat-label>
            <input
              matInput
              type="number"
              formControlName="cashBalance"
              [readonly]="!canEdit()"
            />
          </mat-form-field>
          @if (canEdit()) {
            <button
              mat-flat-button
              type="submit"
              [disabled]="walletForm.invalid || savingWallet()"
            >
              <mat-icon>save</mat-icon> Lưu
            </button>
          }
        </form>
      </div>

      <!-- Summary cards -->
      <div class="cf-tab__summary">
        <div class="summary-item income">
          <span>Tổng thu</span>
          <strong>{{ totalIncome() | vnd }}</strong>
        </div>
        <div class="summary-item expense">
          <span>Tổng chi</span>
          <strong>{{ totalExpense() | vnd }}</strong>
        </div>
        <div
          class="summary-item projection"
          [style.color]="projected() >= 0 ? '#22c55e' : '#ef4444'"
        >
          <span>Dự kiến tháng sau</span>
          <strong>{{ projected() | vnd }}</strong>
        </div>
      </div>

      <button
        mat-flat-button
        (click)="showForm.set(!showForm())"
        style="margin-bottom:16px"
      >
        <mat-icon>add</mat-icon> Thêm
      </button>

      @if (showForm()) {
        <form [formGroup]="form" (ngSubmit)="add()" class="add-form">
          <mat-form-field appearance="outline">
            <mat-label>Mô tả</mat-label>
            <input matInput formControlName="label" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Loại</mat-label>
            <mat-select formControlName="flowType">
              <mat-option value="INCOME">Thu</mat-option>
              <mat-option value="EXPENSE">Chi</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Số tiền</mat-label>
            <input matInput type="number" formControlName="amount" />
          </mat-form-field>
          <button mat-flat-button type="submit" [disabled]="form.invalid">
            Lưu
          </button>
          <button mat-button type="button" (click)="showForm.set(false)">
            Huỷ
          </button>
        </form>
      }

      <table class="cf-table">
        <thead>
          <tr>
            <th>Mô tả</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (e of entries(); track e.id) {
            @if (editingId() === e.id) {
              <tr class="editing-row">
                <td>
                  <mat-form-field appearance="outline" class="inline-field">
                    <input matInput [formControl]="editForm.controls.label" />
                  </mat-form-field>
                </td>
                <td>
                  <mat-form-field
                    appearance="outline"
                    class="inline-field inline-field--select"
                  >
                    <mat-select [formControl]="editForm.controls.flowType">
                      <mat-option value="INCOME">Thu</mat-option>
                      <mat-option value="EXPENSE">Chi</mat-option>
                    </mat-select>
                  </mat-form-field>
                </td>
                <td>
                  <mat-form-field
                    appearance="outline"
                    class="inline-field inline-field--num"
                  >
                    <input
                      matInput
                      type="number"
                      [formControl]="editForm.controls.amount"
                    />
                  </mat-form-field>
                </td>
                <td class="actions-cell">
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="saveEdit(e)"
                    [disabled]="editForm.invalid"
                  >
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="editingId.set(null)">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              </tr>
            } @else {
              <tr>
                <td>{{ e.label }}</td>
                <td
                  [style.color]="
                    e.flowType === 'INCOME' ? '#22c55e' : '#ef4444'
                  "
                >
                  {{ e.flowType === 'INCOME' ? 'Thu' : 'Chi' }}
                </td>
                <td
                  [style.color]="
                    e.flowType === 'INCOME' ? '#22c55e' : '#ef4444'
                  "
                >
                  {{ e.amount | vnd }}
                </td>
                <td class="actions-cell">
                  <button mat-icon-button (click)="startEdit(e)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="remove(e)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            }
          }
          @if (entries().length === 0) {
            <tr>
              <td
                colspan="4"
                style="text-align:center;color:var(--mat-sys-on-surface-variant);padding:20px"
              >
                Chưa có dữ liệu
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .section-title {
        margin: 0 0 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .wallet-section {
        margin-bottom: 24px;
        padding: 16px 20px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 12px;
      }
      .wallet-form {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      .wallet-form mat-form-field {
        flex: 1;
        min-width: 160px;
      }
      .cf-tab__summary {
        display: flex;
        gap: 24px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      .summary-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 20px;
        background: var(--mat-sys-surface-container);
        border-radius: 12px;
        min-width: 140px;
      }
      .summary-item span {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }
      .summary-item strong {
        font-size: 18px;
        font-weight: 600;
      }
      .income strong {
        color: #22c55e;
      }
      .expense strong {
        color: #ef4444;
      }
      .projection {
        border: 2px solid var(--mat-sys-primary);
      }
      .add-form {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        padding: 16px;
        background: var(--mat-sys-surface-container-low);
        border-radius: 12px;
        margin-bottom: 16px;
      }
      .add-form mat-form-field {
        flex: 1;
        min-width: 140px;
      }
      .cf-table {
        width: 100%;
        border-collapse: collapse;
      }
      .cf-table th,
      .cf-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        font-size: 14px;
      }
      .cf-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .cf-table td:first-child,
      .cf-table th:first-child {
        text-align: left;
      }
      .cf-table td:nth-child(2),
      .cf-table th:nth-child(2) {
        text-align: left;
      }
      .cf-table td:nth-child(3),
      .cf-table th:nth-child(3) {
        text-align: right;
      }
      .actions-cell {
        text-align: right;
        white-space: nowrap;
      }
      .editing-row td {
        padding: 4px 12px;
        vertical-align: middle;
      }
      .inline-field {
        width: 100%;
        margin-bottom: -1.25em;
      }
      .inline-field--select {
        min-width: 90px;
      }
      .inline-field--num {
        max-width: 160px;
      }
    `,
  ],
})
export class CashFlowTabComponent implements OnChanges {
  boardId = input.required<string>();
  bankBalance = input<number>(0);
  cashBalance = input<number>(0);
  canEdit = input<boolean>(false);

  walletSaved = output<{ bankBalance: number; cashBalance: number }>();

  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  entries = signal<CashFlowEntryDto[]>([]);
  showForm = signal(false);
  savingWallet = signal(false);
  editingId = signal<string | null>(null);

  totalIncome = () =>
    this.entries()
      .filter((e) => e.flowType === FlowType.INCOME)
      .reduce((s, e) => s + e.amount, 0);
  totalExpense = () =>
    this.entries()
      .filter((e) => e.flowType === FlowType.EXPENSE)
      .reduce((s, e) => s + e.amount, 0);
  net = () => this.totalIncome() - this.totalExpense();
  projected = () => this.bankBalance() + this.cashBalance() + this.net();

  walletForm = this.fb.nonNullable.group({
    bankBalance: [0, [Validators.required, Validators.min(0)]],
    cashBalance: [0, [Validators.required, Validators.min(0)]],
  });

  form = this.fb.nonNullable.group({
    label: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    flowType: [FlowType.INCOME, Validators.required],
  });

  editForm = this.fb.nonNullable.group({
    label: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    flowType: [FlowType.INCOME as FlowType, Validators.required],
  });

  ngOnChanges() {
    this.walletForm.patchValue({
      bankBalance: this.bankBalance(),
      cashBalance: this.cashBalance(),
    });
    this.load();
  }

  load() {
    this.api
      .listCashFlow(this.boardId())
      .subscribe((data) => this.entries.set(data));
  }

  saveWallet() {
    if (this.walletForm.invalid) return;
    const { bankBalance, cashBalance } = this.walletForm.getRawValue();
    this.savingWallet.set(true);
    this.api
      .updateBoard(this.boardId(), { bankBalance, cashBalance })
      .subscribe({
        next: () => {
          this.walletSaved.emit({ bankBalance, cashBalance });
          this.savingWallet.set(false);
        },
        error: () => this.savingWallet.set(false),
      });
  }

  add() {
    if (this.form.invalid) return;
    const { label, amount, flowType } = this.form.getRawValue();
    this.api
      .createCashFlow(this.boardId(), {
        label,
        amount,
        flowType,
        entryDate: new Date().toISOString().slice(0, 10),
      })
      .subscribe(() => {
        this.form.reset({ label: '', amount: 0, flowType: FlowType.INCOME });
        this.showForm.set(false);
        this.load();
      });
  }

  startEdit(e: CashFlowEntryDto) {
    this.editForm.setValue({
      label: e.label,
      amount: e.amount,
      flowType: e.flowType,
    });
    this.editingId.set(e.id);
  }

  saveEdit(e: CashFlowEntryDto) {
    if (this.editForm.invalid) return;
    const { label, amount, flowType } = this.editForm.getRawValue();
    this.api
      .updateCashFlow(this.boardId(), e.id, { label, amount, flowType })
      .subscribe(() => {
        this.editingId.set(null);
        this.load();
      });
  }

  remove(e: CashFlowEntryDto) {
    this.api.deleteCashFlow(this.boardId(), e.id).subscribe(() => this.load());
  }
}
