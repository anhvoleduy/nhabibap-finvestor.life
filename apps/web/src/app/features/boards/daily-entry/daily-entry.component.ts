import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AssetCategoryDto,
  AssetEntryDto,
  CATEGORY_LABELS,
  CategoryType,
  DailyEntriesDto,
} from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../core/board-api.service';
import { NumberFormatDirective } from '../../../shared/directives/number-format.directive';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

interface AssetRow {
  assetId: string;
  assetName: string;
  categoryType: CategoryType;
  categoryLabel: string;
  capital: number | null;
  lastValue: number | null;
  lastDate: string | null;
  totalChi: number | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-daily-entry',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressBarModule,
    MatSnackBarModule,
    NumberFormatDirective,
    VndCurrencyPipe,
    DecimalPipe,
    TranslateModule,
  ],
  template: `
    @if (loading() || submitting()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="page">
      <div class="page__header">
        <div>
          <h2 class="page__title">{{ 'DAILY_ENTRY.TITLE' | translate }}</h2>
          <p class="entry-hint">{{ 'DAILY_ENTRY.SUBTITLE' | translate }}</p>
        </div>
        <div class="page__header-actions">
          <input
            type="date"
            class="date-picker"
            [value]="selectedDate()"
            [max]="today"
            (change)="onDateChange($event)"
          />
          <button
            mat-stroked-button
            [routerLink]="['/boards', boardId()]"
            [disabled]="submitting()"
          >
            <mat-icon>close</mat-icon>
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          @if (!loading() && assetRows().length > 0) {
            <button
              mat-flat-button
              (click)="submit()"
              [disabled]="submitting()"
            >
              <mat-icon>save</mat-icon>
              {{
                submitting()
                  ? ('DAILY_ENTRY.SAVING' | translate)
                  : ('DAILY_ENTRY.SAVE_ALL' | translate)
              }}
            </button>
          }
        </div>
      </div>

      @if (!loading() && assetRows().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">inbox</mat-icon>
          <p class="empty-title">{{ 'ASSETS.EMPTY' | translate }}</p>
          <p class="empty-sub">{{ 'DAILY_ENTRY.EMPTY_SUB' | translate }}</p>
          <button mat-stroked-button [routerLink]="['/boards', boardId()]">
            <mat-icon>arrow_back</mat-icon>
            {{ 'DAILY_ENTRY.BACK' | translate }}
          </button>
        </div>
      }

      <form [formGroup]="form">
        @for (cat of groupedRows(); track cat.label) {
          <div class="category-section">
            <h3 class="category-section__title">{{ cat.label }}</h3>
            <div class="assets-grid">
              @for (row of cat.rows; track row.assetId) {
                <mat-card class="asset-card" appearance="outlined">
                  <mat-card-header>
                    <mat-card-title class="asset-name">{{
                      row.assetName
                    }}</mat-card-title>
                    <mat-card-subtitle class="asset-stats">
                      <div class="stat-row">
                        <span class="stat-label">{{
                          'DAILY_ENTRY.CAPITAL_LABEL' | translate
                        }}</span>
                        <span class="stat-value">{{ row.capital | vnd }}</span>
                        @if (row.totalChi !== null) {
                          <span class="stat-extra">
                            · {{ row.totalChi | number: '1.0-4' }}
                            {{ chiUnit }}
                          </span>
                        }
                      </div>
                      @if (row.lastDate) {
                        <div class="stat-row">
                          <span class="stat-label">{{ row.lastDate }}</span>
                          <span class="stat-value">{{
                            row.lastValue | vnd
                          }}</span>
                          @let pct = profitPct(row);
                          @if (pct !== null) {
                            <span
                              class="stat-delta"
                              [class.stat-delta--up]="pct > 0"
                              [class.stat-delta--down]="pct < 0"
                            >
                              {{ pct > 0 ? '↑' : pct < 0 ? '↓' : '·' }}
                              {{ pct > 0 ? '+' : ''
                              }}{{ pct | number: '1.1-2' }}%
                            </span>
                          }
                        </div>
                      }
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    @if (row.categoryType === 'GOLD') {
                      @if (row.totalChi && row.totalChi > 0) {
                        <mat-form-field
                          appearance="outline"
                          class="value-field"
                        >
                          <mat-label>{{
                            'DAILY_ENTRY.GOLD_PRICE_LABEL'
                              | translate: { date: selectedDate() }
                          }}</mat-label>
                          <input
                            matInput
                            appNumberFormat
                            [formControlName]="row.assetId"
                          />
                          <mat-hint>
                            × {{ row.totalChi | number: '1.0-4' }}
                            {{ chiUnit }}
                            @let goldVal = formValues()[row.assetId];
                            @if (goldVal !== '' && +goldVal > 0) {
                              &nbsp;=
                              {{ +goldVal * row.totalChi! | vnd }}
                            }
                          </mat-hint>
                        </mat-form-field>
                      } @else {
                        <p class="no-chi-hint">
                          {{ 'DAILY_ENTRY.ADD_GOLD_FIRST' | translate }}
                        </p>
                      }
                    } @else if (row.categoryType === 'SAVINGS') {
                      <mat-form-field appearance="outline" class="value-field">
                        <mat-label>{{
                          'DAILY_ENTRY.SAVINGS_INTEREST' | translate
                        }}</mat-label>
                        <input
                          matInput
                          appNumberFormat
                          [formControlName]="row.assetId"
                        />
                        <mat-hint>
                          @let interest = formValues()[row.assetId];
                          @if (interest !== '' && +interest > 0) {
                            {{ row.capital | vnd }} + {{ +interest | vnd }} =
                            {{ (row.capital ?? 0) + +interest | vnd }}
                          } @else {
                            {{ row.capital | vnd }} + lãi
                          }
                        </mat-hint>
                      </mat-form-field>
                    } @else {
                      <mat-form-field appearance="outline" class="value-field">
                        <mat-label>{{
                          'DAILY_ENTRY.VALUE_LABEL'
                            | translate: { date: selectedDate() }
                        }}</mat-label>
                        <input
                          matInput
                          appNumberFormat
                          [formControlName]="row.assetId"
                        />
                        <mat-hint>
                          @let otherVal = formValues()[row.assetId];
                          @if (otherVal !== '' && +otherVal > 0) {
                            {{ +otherVal | vnd }}
                          }
                        </mat-hint>
                      </mat-form-field>
                    }
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }
      </form>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 32px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .page__title {
        margin: 0 0 4px;
        font-size: 26px;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
        letter-spacing: -0.5px;
      }

      .page__header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .entry-hint {
        margin: 0;
        font-size: 14px;
        color: var(--mat-sys-on-surface-variant);
      }

      .date-picker {
        padding: 8px 12px;
        border: 1px solid var(--mat-sys-outline);
        border-radius: 8px;
        font-size: 14px;
        background: transparent;
        color: var(--mat-sys-on-surface);
        cursor: pointer;
        font-family: inherit;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 64px 24px;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
      }

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.4;
      }

      .empty-title {
        margin: 8px 0 0;
        font-size: 18px;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
      }

      .empty-sub {
        margin: 0 0 16px;
        font-size: 14px;
      }

      .category-section {
        margin-bottom: 36px;
      }

      .category-section__title {
        margin: 0 0 14px;
        font-size: 15px;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
        padding-bottom: 10px;
        border-bottom: 2px solid var(--mat-sys-primary);
        display: inline-block;
      }

      .assets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
      }

      .asset-card {
        transition: box-shadow 0.2s;
      }

      .asset-name {
        font-size: 15px;
        font-weight: 500;
      }

      .asset-stats {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 6px;
      }

      .stat-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 13px;
        line-height: 1.4;
      }

      .stat-label {
        color: var(--mat-sys-on-surface-variant);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        flex-shrink: 0;
      }

      .stat-value {
        color: var(--mat-sys-on-surface);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono',
          monospace;
        font-size: 14px;
      }

      .stat-extra {
        color: var(--mat-sys-on-surface-variant);
        font-size: 12px;
      }

      .stat-delta {
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 6px;
        background: color-mix(
          in srgb,
          var(--mat-sys-on-surface-variant) 12%,
          transparent
        );
        color: var(--mat-sys-on-surface-variant);
        font-variant-numeric: tabular-nums;
      }

      .stat-delta--up {
        color: #1b873b;
        background: color-mix(in srgb, #1b873b 14%, transparent);
      }

      .stat-delta--down {
        color: #c0392b;
        background: color-mix(in srgb, #c0392b 14%, transparent);
      }

      .value-field {
        width: 100%;
        margin-top: 8px;
        display: block;
      }

      .value-field input.mat-mdc-input-element {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono',
          monospace;
        font-variant-numeric: tabular-nums;
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }

      .no-chi-hint {
        margin: 8px 0 0;
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class DailyEntryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly today = new Date().toISOString().slice(0, 10);
  readonly chiUnit = 'Chỉ';

  boardId = signal('');
  loading = signal(true);
  submitting = signal(false);
  assetRows = signal<AssetRow[]>([]);
  selectedDate = signal(this.today);
  form: FormGroup = this.fb.group({});
  formValues = signal<Record<string, number | ''>>({});
  private formSub?: Subscription;

  groupedRows = computed(() => {
    const map = new Map<string, AssetRow[]>();
    for (const row of this.assetRows()) {
      const existing = map.get(row.categoryLabel) ?? [];
      existing.push(row);
      map.set(row.categoryLabel, existing);
    }
    return Array.from(map.entries()).map(([label, rows]) => ({ label, rows }));
  });

  ngOnInit() {
    this.boardId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.load();
  }

  load() {
    const date = this.selectedDate();
    this.loading.set(true);
    forkJoin({
      cats: this.api.getCategories(this.boardId()),
      latest: this.api.getLatestEntries(this.boardId()),
      forDate: this.api
        .getEntriesForDate(this.boardId(), date)
        .pipe(catchError(() => of({ date, entries: [] } as DailyEntriesDto))),
    }).subscribe({
      next: ({ cats: rawCats, latest, forDate }) => {
        const stored = localStorage.getItem(`cat-order-${this.boardId()}`);
        let order: string[] = [];
        try {
          order = stored ? JSON.parse(stored) : [];
        } catch {
          /* ignore */
        }
        const cats: AssetCategoryDto[] =
          order.length > 0
            ? [
                ...(order
                  .map((id) =>
                    rawCats.find((c: AssetCategoryDto) => c.id === id),
                  )
                  .filter(Boolean) as AssetCategoryDto[]),
                ...rawCats.filter(
                  (c: AssetCategoryDto) => !order.includes(c.id),
                ),
              ]
            : rawCats;

        const latestMap = new Map(
          (latest as AssetEntryDto[]).map((e) => [e.assetId, e]),
        );
        const dateMap = new Map(forDate.entries.map((e) => [e.assetId, e]));

        const rows: AssetRow[] = cats.flatMap((cat: AssetCategoryDto) =>
          cat.assets.map((a) => ({
            assetId: a.id,
            assetName: a.name,
            categoryType: cat.type,
            categoryLabel: CATEGORY_LABELS[cat.type],
            capital: a.capital,
            lastValue: latestMap.get(a.id)?.currentValue ?? null,
            lastDate: latestMap.get(a.id)?.entryDate ?? null,
            totalChi: a.totalChi ?? null,
          })),
        );
        this.assetRows.set(rows);

        const controls: Record<string, unknown> = {};
        for (const row of rows) {
          const dateEntry = dateMap.get(row.assetId);
          let prefill: number | '' = '';
          const source =
            dateEntry ??
            (row.lastValue != null ? { currentValue: row.lastValue } : null);
          if (source) {
            if (
              row.categoryType === CategoryType.GOLD &&
              row.totalChi &&
              row.totalChi > 0
            ) {
              prefill = Math.round(source.currentValue / row.totalChi);
            } else if (row.categoryType === CategoryType.SAVINGS) {
              prefill = source.currentValue - (row.capital ?? 0);
            } else {
              prefill = source.currentValue;
            }
          }
          controls[row.assetId] = [prefill, Validators.min(0)];
        }
        this.form = this.fb.group(controls);
        this.formSub?.unsubscribe();
        this.formValues.set(
          this.form.getRawValue() as Record<string, number | ''>,
        );
        this.formSub = this.form.valueChanges.subscribe((v) =>
          this.formValues.set(v as Record<string, number | ''>),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  profitPct(row: AssetRow): number | null {
    if (row.capital === null || row.capital === 0 || row.lastValue === null) {
      return null;
    }
    return ((row.lastValue - row.capital) / row.capital) * 100;
  }

  onDateChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.selectedDate.set(value);
      this.load();
    }
  }

  submit() {
    const values = this.form.getRawValue() as Record<string, number | ''>;
    const rowMap = new Map(this.assetRows().map((r) => [r.assetId, r]));
    const entries = Object.entries(values)
      .filter(([, v]) => v !== '' && v !== null && !isNaN(Number(v)))
      .map(([assetId, inputValue]) => {
        const row = rowMap.get(assetId);
        let currentValue = Number(inputValue);
        if (
          row?.categoryType === CategoryType.GOLD &&
          row.totalChi &&
          row.totalChi > 0
        ) {
          currentValue = Math.round(Number(inputValue) * row.totalChi);
        } else if (row?.categoryType === CategoryType.SAVINGS) {
          currentValue = Number(inputValue) + (row.capital ?? 0);
        }
        return { assetId, currentValue };
      });

    if (entries.length === 0) return;

    this.submitting.set(true);
    this.api
      .submitEntries(this.boardId(), { date: this.selectedDate(), entries })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open(
            this.translate.instant('DAILY_ENTRY.SAVE_SUCCESS'),
            this.translate.instant('COMMON.OK'),
            { duration: 3000 },
          );
          this.router.navigate(['/boards', this.boardId()]);
        },
        error: () => {
          this.submitting.set(false);
          this.snackBar.open(
            this.translate.instant('DAILY_ENTRY.SAVE_ERROR'),
            this.translate.instant('COMMON.OK'),
            { duration: 4000 },
          );
        },
      });
  }
}
