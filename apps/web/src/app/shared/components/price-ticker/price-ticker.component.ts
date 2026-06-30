import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { PriceQuoteDto } from '@nhabibap-myportfolio/shared-types';

const POLL_MS = 60_000;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-price-ticker',
  standalone: true,
  imports: [DecimalPipe, MatIconModule],
  template: `
    @if (quotes.value().length > 0) {
      <div class="ticker" role="marquee" aria-label="Realtime asset prices">
        <div class="ticker__track">
          <!-- Repeated runs so the marquee scrolls seamlessly even with few
               items. Scroll distance = one run width (-25% of 4 runs). -->
          @for (pass of [0, 1, 2, 3]; track pass) {
            <div
              class="ticker__run"
              [attr.aria-hidden]="pass === 0 ? null : 'true'"
            >
              @for (q of quotes.value(); track q.symbol) {
                <span class="ticker__item">
                  <span class="ticker__label">{{ q.label }}</span>
                  <span class="ticker__price">
                    {{ q.price | number: '1.0-2' }} {{ q.unit }}
                  </span>
                  @if (q.changePct !== null) {
                    <span
                      class="ticker__chg"
                      [class.ticker__chg--up]="q.changePct >= 0"
                      [class.ticker__chg--down]="q.changePct < 0"
                    >
                      <mat-icon class="ticker__arrow">{{
                        q.changePct >= 0 ? 'arrow_drop_up' : 'arrow_drop_down'
                      }}</mat-icon>
                      {{ q.changePct | number: '1.2-2' }}%
                    </span>
                  }
                </span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .ticker {
        overflow: hidden;
        white-space: nowrap;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-low);
        margin-bottom: 20px;
      }
      .ticker__track {
        display: inline-flex;
        animation: ticker-scroll 40s linear infinite;
      }
      .ticker:hover .ticker__track {
        animation-play-state: paused;
      }
      .ticker__run {
        display: inline-flex;
      }
      .ticker__item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        font-size: 14px;
        white-space: nowrap;
      }
      .ticker__label {
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }
      .ticker__price {
        color: var(--mat-sys-on-surface-variant);
      }
      .ticker__chg {
        display: inline-flex;
        align-items: center;
      }
      .ticker__arrow {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
      }
      .ticker__chg--up {
        color: #22c55e;
      }
      .ticker__chg--down {
        color: #ef4444;
      }
      @keyframes ticker-scroll {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-25%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ticker__track {
          animation: none;
        }
        .ticker {
          overflow-x: auto;
        }
      }
    `,
  ],
})
export class PriceTickerComponent implements OnInit, OnDestroy {
  // Bumped on an interval; read by the resource request so it refetches.
  private readonly tick = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  protected readonly quotes = httpResource<PriceQuoteDto[]>(
    () => ({ url: '/api/prices', params: { _t: this.tick() } }),
    { defaultValue: [] },
  );

  ngOnInit(): void {
    this.timer = setInterval(() => this.tick.update((n) => n + 1), POLL_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
