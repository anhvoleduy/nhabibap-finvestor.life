import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnChanges,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs';
import { NavSnapshotDto } from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../../../core/board-api.service';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';

type Granularity = 'monthly' | 'quarterly' | 'yearly';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nav-tab',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    VndCurrencyPipe,
  ],
  template: `
    <div class="nav-tab">
      <div class="nav-tab__toolbar">
        <div class="granularity-toggle">
          @for (g of granularities; track g.value) {
            <button
              mat-flat-button
              [class.active]="granularity() === g.value"
              (click)="setGranularity(g.value)"
            >
              {{ g.label }}
            </button>
          }
        </div>
        <button mat-stroked-button (click)="showAddForm.set(!showAddForm())">
          <mat-icon>add</mat-icon> Thêm dữ liệu quá khứ
        </button>
      </div>

      @if (showAddForm()) {
        <form
          [formGroup]="addForm"
          (ngSubmit)="submitManual()"
          class="add-form"
        >
          <mat-form-field appearance="outline">
            <mat-label>Ngày (YYYY-MM-DD)</mat-label>
            <input matInput formControlName="date" placeholder="2024-01-31" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tổng giá trị tài sản (VND)</mat-label>
            <input matInput type="number" formControlName="totalValue" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tổng vốn (VND, tuỳ chọn)</mat-label>
            <input matInput type="number" formControlName="totalCapital" />
          </mat-form-field>
          <div class="add-form__actions">
            <button mat-flat-button type="submit" [disabled]="addForm.invalid">
              Lưu
            </button>
            <button mat-button type="button" (click)="showAddForm.set(false)">
              Huỷ
            </button>
          </div>
        </form>
      }

      <div class="chart-wrap">
        <canvas
          baseChart
          [data]="chartData()"
          [options]="chartOptions"
          type="line"
        ></canvas>
      </div>

      <table class="nav-table">
        <thead>
          <tr>
            <th>Kỳ</th>
            <th>Giá trị tài sản ròng</th>
            <th>Tăng trưởng {{ periodLabel() }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (snap of reversedSnapshots(); track snap.id) {
            @if (editingId() === snap.id) {
              <tr class="editing-row">
                <td>
                  <input
                    class="inline-input"
                    type="date"
                    [value]="editValue().date"
                    (input)="setEditDate($event)"
                  />
                </td>
                <td>
                  <input
                    class="inline-input"
                    type="number"
                    [value]="editValue().totalValue"
                    (input)="setEditValue('totalValue', $event)"
                  />
                </td>
                <td></td>
                <td class="row-actions">
                  <button mat-icon-button (click)="saveEdit(snap)">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button mat-icon-button (click)="cancelEdit()">
                    <mat-icon>close</mat-icon>
                  </button>
                </td>
              </tr>
            } @else {
              <tr>
                <td>{{ formatPeriod(snap.snapshotDate) }}</td>
                <td>{{ snap.totalValue | vnd }}</td>
                <td
                  [style.color]="
                    (snap.periodGrowth ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                  "
                >
                  {{
                    snap.periodGrowth !== null
                      ? (snap.periodGrowth | number: '1.2-2') + '%'
                      : '—'
                  }}
                </td>
                <td class="row-actions">
                  <button mat-icon-button (click)="startEdit(snap)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteSnapshot(snap)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            }
          }
          @if (snapshots().length === 0) {
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
      .nav-tab {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .nav-tab__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      .granularity-toggle {
        display: flex;
        gap: 8px;
      }
      .granularity-toggle button.active {
        background-color: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }
      .add-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: flex-start;
        padding: 16px;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
      }
      .add-form mat-form-field {
        flex: 1 1 180px;
      }
      .add-form__actions {
        display: flex;
        gap: 8px;
        align-items: center;
        padding-top: 4px;
      }
      .chart-wrap {
        max-height: 320px;
      }
      .nav-table {
        width: 100%;
        border-collapse: collapse;
      }
      .nav-table th,
      .nav-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        font-size: 14px;
      }
      .nav-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .nav-table td:not(:first-child):not(.row-actions),
      .nav-table th:not(:first-child):not(:last-child) {
        text-align: right;
      }
      .row-actions {
        text-align: right;
        white-space: nowrap;
        width: 1%;
        padding: 0 4px;
      }
      .inline-input {
        width: 100%;
        max-width: 160px;
        padding: 4px 8px;
        border: 1px solid var(--mat-sys-outline);
        border-radius: 4px;
        font-size: 14px;
        text-align: right;
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface);
      }
      .editing-row {
        background: var(--mat-sys-surface-variant);
      }
    `,
  ],
})
export class NavTabComponent implements OnChanges {
  boardId = input.required<string>();
  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  snapshots = signal<NavSnapshotDto[]>([]);
  reversedSnapshots = computed(() => [...this.snapshots()].reverse());
  granularity = signal<Granularity>('monthly');
  showAddForm = signal(false);
  editingId = signal<string | null>(null);
  editValue = signal({ date: '', totalValue: 0, totalCapital: 0 });

  granularities: { value: Granularity; label: string }[] = [
    { value: 'monthly', label: 'Tháng' },
    { value: 'quarterly', label: 'Quý' },
    { value: 'yearly', label: 'Năm' },
  ];

  periodLabel = computed(() => {
    const map: Record<Granularity, string> = {
      monthly: 'tháng',
      quarterly: 'quý',
      yearly: 'năm',
    };
    return map[this.granularity()];
  });

  addForm = this.fb.group({
    date: [
      '',
      [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    ],
    totalValue: [
      null as number | null,
      [Validators.required, Validators.min(0)],
    ],
    totalCapital: [null as number | null],
  });

  formatPeriod(date: string): string {
    const [year, month] = date.split('-').map(Number);
    if (this.granularity() === 'yearly') return `${year}`;
    if (this.granularity() === 'quarterly')
      return `Q${Math.ceil(month / 3)}/${year}`;
    return `T${month}/${year}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData = computed<ChartData<any>>(() => ({
    labels: this.snapshots().map((s) => this.formatPeriod(s.snapshotDate)),
    datasets: [
      {
        label: 'Giá trị tài sản ròng',
        data: this.snapshots().map((s) => s.totalValue),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.1)',
        fill: true,
        tension: 0.3,
        type: 'line',
        yAxisID: 'y',
      },
      {
        label: `Tăng trưởng (%)`,
        data: this.snapshots().map((s) => s.periodGrowth ?? 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.6)',
        type: 'bar',
        yAxisID: 'y1',
      },
    ],
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartOptions: ChartOptions<any> = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: { position: 'left', title: { display: true, text: 'NAV (VND)' } },
      y1: {
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: '%' },
      },
    },
  };

  ngOnChanges() {
    this.load();
  }

  setGranularity(g: Granularity) {
    this.granularity.set(g);
    this.load();
  }

  load() {
    this.api
      .getNav(this.boardId(), undefined, undefined, this.granularity())
      .subscribe((data) => this.snapshots.set(data));
  }

  startEdit(snap: NavSnapshotDto) {
    this.editingId.set(snap.id);
    this.editValue.set({
      date: snap.snapshotDate,
      totalValue: snap.totalValue,
      totalCapital: snap.totalCapital,
    });
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  setEditDate(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.editValue.update((v) => ({ ...v, date: val }));
  }

  setEditValue(field: 'totalValue' | 'totalCapital', event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.editValue.update((v) => ({ ...v, [field]: val }));
  }

  saveEdit(snap: NavSnapshotDto) {
    const { date, totalValue, totalCapital } = this.editValue();
    const doSave = () =>
      this.api.upsertManualNav(this.boardId(), {
        date,
        totalValue,
        totalCapital,
      });
    const finish = () => {
      this.editingId.set(null);
      this.load();
    };
    if (date !== snap.snapshotDate) {
      this.api
        .deleteNav(this.boardId(), snap.id)
        .pipe(switchMap(() => doSave()))
        .subscribe(finish);
    } else {
      doSave().subscribe(finish);
    }
  }

  deleteSnapshot(snap: NavSnapshotDto) {
    this.api.deleteNav(this.boardId(), snap.id).subscribe(() => this.load());
  }

  submitManual() {
    if (this.addForm.invalid) return;
    const { date, totalValue, totalCapital } = this.addForm.getRawValue();
    this.api
      .upsertManualNav(this.boardId(), {
        date: date!,
        totalValue: totalValue!,
        ...(totalCapital != null ? { totalCapital } : {}),
      })
      .subscribe(() => {
        this.showAddForm.set(false);
        this.addForm.reset();
        this.load();
      });
  }
}
