import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-card',
  standalone: true,
  imports: [DecimalPipe, NgClass, VndCurrencyPipe],
  template: `
    <div class="stat-card">
      <div class="stat-card__label">{{ label() }}</div>
      <div class="stat-card__value" [ngClass]="valueClass()">
        @if (isPercent()) {
          {{ value() | number: '1.2-2' }}%
        } @else {
          {{ value() | vnd }}
        }
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card {
        background: var(--mat-sys-surface-container);
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 140px;
      }
      .stat-card__label {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 6px;
      }
      .stat-card__value {
        font-size: 18px;
        font-weight: 600;
      }
      .positive {
        color: #22c55e;
      }
      .negative {
        color: #ef4444;
      }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<number | null>();
  isPercent = input(false);
  valueClass = input<string>('');
}
