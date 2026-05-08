import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
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
          [style.color]="net() >= 0 ? '#22c55e' : '#ef4444'"
        >
          <span>Ròng</span>
          <strong>{{ net() | vnd }}</strong>
        </div>
      </div>

      <!-- Two-column entry sections -->
      <div class="cf-columns">
        <!-- Income section -->
        <div class="cf-section cf-section--income">
          <div class="cf-section__header">
            <div class="cf-section__title">
              <mat-icon>trending_up</mat-icon>
              <span>Thu nhập</span>
              <span class="cf-section__total">{{ totalIncome() | vnd }}</span>
            </div>
            @if (canEdit()) {
              <button
                mat-icon-button
                class="cf-section__add-btn"
                (click)="openAddForm(FlowType.INCOME)"
              >
                <mat-icon>add</mat-icon>
              </button>
            }
          </div>

          @if (showForm() && formFlowType() === 'INCOME') {
            <form [formGroup]="form" (ngSubmit)="add()" class="add-form">
              <mat-form-field appearance="outline">
                <mat-label>Mô tả</mat-label>
                <input matInput formControlName="label" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Số tiền</mat-label>
                <input matInput type="number" formControlName="amount" />
              </mat-form-field>
              <div class="add-form__actions">
                <button mat-flat-button type="submit" [disabled]="form.invalid">
                  Lưu
                </button>
                <button mat-button type="button" (click)="showForm.set(false)">
                  Huỷ
                </button>
              </div>
            </form>
          }

          <table class="cf-table">
            <thead>
              <tr>
                <th>Mô tả</th>
                <th>Số tiền</th>
                @if (canEdit()) {
                  <th></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (e of incomeEntries(); track e.id) {
                @if (editingId() === e.id) {
                  <tr class="editing-row">
                    <td>
                      <mat-form-field appearance="outline" class="inline-field">
                        <input
                          matInput
                          [formControl]="editForm.controls.label"
                        />
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
                    @if (canEdit()) {
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
                    }
                  </tr>
                } @else {
                  <tr>
                    <td>{{ e.label }}</td>
                    <td class="amount-cell income-amount">
                      {{ e.amount | vnd }}
                    </td>
                    @if (canEdit()) {
                      <td class="actions-cell">
                        <button mat-icon-button (click)="startEdit(e)">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="remove(e)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    }
                  </tr>
                }
              }
              @if (incomeEntries().length === 0) {
                <tr>
                  <td [attr.colspan]="canEdit() ? 3 : 2" class="empty-cell">
                    Chưa có dữ liệu
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Expense section -->
        <div class="cf-section cf-section--expense">
          <div class="cf-section__header">
            <div class="cf-section__title">
              <mat-icon>trending_down</mat-icon>
              <span>Chi tiêu</span>
              <span class="cf-section__total">{{ totalExpense() | vnd }}</span>
            </div>
            @if (canEdit()) {
              <button
                mat-icon-button
                class="cf-section__add-btn"
                (click)="openAddForm(FlowType.EXPENSE)"
              >
                <mat-icon>add</mat-icon>
              </button>
            }
          </div>

          @if (showForm() && formFlowType() === 'EXPENSE') {
            <form [formGroup]="form" (ngSubmit)="add()" class="add-form">
              <mat-form-field appearance="outline">
                <mat-label>Mô tả</mat-label>
                <input matInput formControlName="label" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Số tiền</mat-label>
                <input matInput type="number" formControlName="amount" />
              </mat-form-field>
              <div class="add-form__actions">
                <button mat-flat-button type="submit" [disabled]="form.invalid">
                  Lưu
                </button>
                <button mat-button type="button" (click)="showForm.set(false)">
                  Huỷ
                </button>
              </div>
            </form>
          }

          <table class="cf-table">
            <thead>
              <tr>
                <th>Mô tả</th>
                <th>Số tiền</th>
                @if (canEdit()) {
                  <th></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (e of expenseEntries(); track e.id) {
                @if (editingId() === e.id) {
                  <tr class="editing-row">
                    <td>
                      <mat-form-field appearance="outline" class="inline-field">
                        <input
                          matInput
                          [formControl]="editForm.controls.label"
                        />
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
                    @if (canEdit()) {
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
                    }
                  </tr>
                } @else {
                  <tr>
                    <td>{{ e.label }}</td>
                    <td class="amount-cell expense-amount">
                      {{ e.amount | vnd }}
                    </td>
                    @if (canEdit()) {
                      <td class="actions-cell">
                        <button mat-icon-button (click)="startEdit(e)">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="remove(e)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    }
                  </tr>
                }
              }
              @if (expenseEntries().length === 0) {
                <tr>
                  <td [attr.colspan]="canEdit() ? 3 : 2" class="empty-cell">
                    Chưa có dữ liệu
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
      .cf-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 700px) {
        .cf-columns {
          grid-template-columns: 1fr;
        }
      }
      .cf-section {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--mat-sys-outline-variant);
      }
      .cf-section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
      }
      .cf-section--income .cf-section__header {
        background: #16a34a1a;
        border-bottom: 2px solid #22c55e;
      }
      .cf-section--expense .cf-section__header {
        background: #dc26261a;
        border-bottom: 2px solid #ef4444;
      }
      .cf-section__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
      }
      .cf-section--income .cf-section__title mat-icon {
        color: #22c55e;
      }
      .cf-section--expense .cf-section__title mat-icon {
        color: #ef4444;
      }
      .cf-section__total {
        font-size: 13px;
        font-weight: 700;
        margin-left: 4px;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .cf-section--income .cf-section__total {
        background: #22c55e22;
        color: #16a34a;
      }
      .cf-section--expense .cf-section__total {
        background: #ef444422;
        color: #dc2626;
      }
      .add-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
        background: var(--mat-sys-surface-container-low);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      .add-form mat-form-field {
        width: 100%;
      }
      .add-form__actions {
        display: flex;
        gap: 8px;
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
      .cf-table tr:last-child td {
        border-bottom: none;
      }
      .cf-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
        text-align: left;
      }
      .amount-cell {
        text-align: right;
        font-weight: 500;
      }
      .income-amount {
        color: #22c55e;
      }
      .expense-amount {
        color: #ef4444;
      }
      .empty-cell {
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
        padding: 20px !important;
        font-size: 13px;
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
      .inline-field--num {
        max-width: 160px;
      }
    `,
  ],
})
export class CashFlowTabComponent {
  boardId = input.required<string>();
  canEdit = input<boolean>(false);

  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly FlowType = FlowType;

  entries = signal<CashFlowEntryDto[]>([]);
  showForm = signal(false);
  formFlowType = signal<FlowType>(FlowType.INCOME);
  editingId = signal<string | null>(null);

  incomeEntries = computed(() =>
    this.entries().filter((e) => e.flowType === FlowType.INCOME),
  );
  expenseEntries = computed(() =>
    this.entries().filter((e) => e.flowType === FlowType.EXPENSE),
  );
  totalIncome = computed(() =>
    this.incomeEntries().reduce((s, e) => s + e.amount, 0),
  );
  totalExpense = computed(() =>
    this.expenseEntries().reduce((s, e) => s + e.amount, 0),
  );
  net = computed(() => this.totalIncome() - this.totalExpense());

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

  constructor() {
    effect(() => {
      this.load();
    });
  }

  load() {
    this.api
      .listCashFlow(this.boardId())
      .subscribe((data) => this.entries.set(data));
  }

  openAddForm(flowType: FlowType) {
    this.formFlowType.set(flowType);
    this.form.reset({ label: '', amount: 0, flowType });
    this.showForm.set(true);
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
        this.form.reset({ label: '', amount: 0, flowType });
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
