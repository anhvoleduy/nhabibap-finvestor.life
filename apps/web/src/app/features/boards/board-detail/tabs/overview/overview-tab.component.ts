import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { inject } from '@angular/core';
import {
  AssetCategoryDto,
  CATEGORY_LABELS,
  CategoryType,
} from '@nhabibap-myportfolio/shared-types';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';
import { StatCardComponent } from '../../../../../shared/components/stat-card/stat-card.component';

const CATEGORY_COLORS: Record<CategoryType, string> = {
  GOLD: '#f59e0b',
  OPEN_FUND: '#3b82f6',
  ETF: '#8b5cf6',
  CRYPTO: '#ec4899',
  SAVINGS: '#10b981',
  CASH: '#6b7280',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-overview-tab',
  standalone: true,
  imports: [
    DecimalPipe,
    BaseChartDirective,
    VndCurrencyPipe,
    StatCardComponent,
    TranslateModule,
  ],
  template: `
    <div class="overview">
      <div class="overview__stats">
        <app-stat-card
          [label]="'STATS.TOTAL_CAPITAL' | translate"
          [value]="totalCapital()"
        />
        <app-stat-card
          [label]="'STATS.TOTAL_VALUE' | translate"
          [value]="totalValue()"
        />
        <app-stat-card
          [label]="'STATS.PROFIT' | translate"
          [value]="profit()"
          [valueClass]="profit() >= 0 ? 'positive' : 'negative'"
        />
        <app-stat-card
          [label]="'STATS.PROFIT_PCT' | translate"
          [value]="profitPct()"
          [isPercent]="true"
          [valueClass]="profitPct() >= 0 ? 'positive' : 'negative'"
        />
      </div>

      <div class="overview__body">
        <div class="chart-wrap">
          <canvas
            baseChart
            [data]="chartData()"
            [options]="chartOptions"
            type="doughnut"
          ></canvas>
        </div>

        <table class="cat-table">
          <thead>
            <tr>
              <th>{{ 'OVERVIEW.CATEGORY' | translate }}</th>
              <th>{{ 'STATS.TOTAL_CAPITAL' | translate }}</th>
              <th>{{ 'STATS.VALUE' | translate }}</th>
              <th>{{ 'STATS.PROFIT_PCT_COL' | translate }}</th>
              <th>{{ 'OVERVIEW.WEIGHT' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td>{{ cat.label }}</td>
                <td>{{ cat.totalCapital | vnd }}</td>
                <td>{{ cat.totalValue | vnd }}</td>
                <td
                  [style.color]="
                    (cat.profitPct ?? 0) >= 0 ? '#22c55e' : '#ef4444'
                  "
                >
                  {{ cat.profitPct ?? 0 | number: '1.2-2' }}%
                </td>
                <td>
                  {{
                    totalValue() > 0
                      ? ((cat.totalValue / totalValue()) * 100
                        | number: '1.1-1')
                      : 0
                  }}%
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      .overview__stats {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 24px;
      }
      .overview__body {
        display: flex;
        gap: 32px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .chart-wrap {
        width: 280px;
        flex-shrink: 0;
      }
      .cat-table {
        flex: 1;
        border-collapse: collapse;
        min-width: 400px;
      }
      .cat-table th,
      .cat-table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        text-align: right;
        font-size: 14px;
      }
      .cat-table th {
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .cat-table td:first-child,
      .cat-table th:first-child {
        text-align: left;
      }
    `,
  ],
})
export class OverviewTabComponent {
  private readonly translate = inject(TranslateService);

  categories = input.required<AssetCategoryDto[]>();

  totalCapital = computed(() =>
    this.categories().reduce((s, c) => s + (c.totalCapital ?? 0), 0),
  );
  totalValue = computed(() =>
    this.categories().reduce((s, c) => s + c.totalValue, 0),
  );
  profit = computed(() => this.totalValue() - this.totalCapital());
  profitPct = computed(() =>
    this.totalCapital() > 0 ? (this.profit() / this.totalCapital()) * 100 : 0,
  );

  chartData = computed<ChartData<'doughnut'>>(() => ({
    labels: this.categories().map((c) => CATEGORY_LABELS[c.type]),
    datasets: [
      {
        data: this.categories().map((c) => c.totalValue),
        backgroundColor: this.categories().map((c) => CATEGORY_COLORS[c.type]),
        borderWidth: 2,
      },
    ],
  }));

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };
}
