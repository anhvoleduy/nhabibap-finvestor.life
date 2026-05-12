import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VndCurrencyPipe } from '../../pipes/vnd-currency.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-card',
  standalone: true,
  imports: [DecimalPipe, NgClass, MatIconModule, VndCurrencyPipe],
  template: `
    <div class="stat-card">
      <div class="stat-card__label">{{ label() }}</div>
      <div class="stat-card__value" [ngClass]="valueClass()">
        @if (isPercent()) {
          <span class="value-text"> {{ value() | number: '1.2-2' }}% </span>
          @if (value() !== null) {
            <mat-icon class="trend-icon">
              {{ (value() ?? 0) >= 0 ? 'trending_up' : 'trending_down' }}
            </mat-icon>
          }
        } @else if (unit()) {
          <span class="value-text">
            {{ value() | number: '1.0-4' }} {{ unit() }}
          </span>
        } @else {
          <span class="value-text">{{ value() | vnd }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .stat-card {
        background: var(--mat-sys-surface-container);
        border-radius: 14px;
        padding: 18px 20px;
        min-width: 150px;
        border: 1px solid var(--mat-sys-outline-variant);
        transition: box-shadow 150ms;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      }

      .stat-card__label {
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--mat-sys-on-surface-variant);
        margin-bottom: 8px;
      }

      .stat-card__value {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .value-text {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.5px;
        color: var(--mat-sys-on-surface);
      }

      .stat-card__value.positive .value-text {
        color: #10b981;
      }

      .stat-card__value.negative .value-text {
        color: var(--mat-sys-error);
      }

      .trend-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .stat-card__value.positive .trend-icon {
        color: #10b981;
      }

      .stat-card__value.negative .trend-icon {
        color: var(--mat-sys-error);
      }
    `,
  ],
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<number | null>();
  isPercent = input(false);
  unit = input<string>('');
  valueClass = input<string>('');
}
