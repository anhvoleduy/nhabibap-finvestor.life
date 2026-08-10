import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  AssetDto,
  BoardSummaryDto,
  DcaSchedule,
  DCA_METADATA_KEY,
} from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../core/board-api.service';
import { LanguageService } from '../../core/language.service';
import {
  DcaStatus,
  dcaStatus,
  effectiveDcaDate,
} from '../../shared/util/dca.util';
import { dateToIso } from '../../shared/util/date.util';

interface DcaReminderItem {
  key: string;
  boardId: string;
  boardName: string;
  catId: string;
  asset: AssetDto;
  schedule: DcaSchedule;
  status: DcaStatus;
  effectiveDate: string;
}

interface CalendarCell {
  date: Date;
  iso: string;
  inMonth: boolean;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** Monday-first 6-week grid covering the month (with lead/trail days). */
function buildMonthGrid(monthStart: Date): CalendarCell[] {
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1 - mondayOffset,
  );
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    );
    return {
      date,
      iso: dateToIso(date),
      inMonth: date.getMonth() === monthStart.getMonth(),
    };
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dca-calendar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="page">
      <div class="page__header">
        <h2 class="page__title">{{ 'DCA.CALENDAR.TITLE' | translate }}</h2>
        <p class="page__subtitle">
          {{ 'DCA.CALENDAR.SUBTITLE' | translate }}
        </p>
      </div>

      <div class="cal-toolbar">
        <button
          mat-icon-button
          [attr.aria-label]="'DCA.CALENDAR.PREV' | translate"
          (click)="prevMonth()"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="cal-toolbar__label">{{ monthLabel() }}</span>
        <button
          mat-icon-button
          [attr.aria-label]="'DCA.CALENDAR.NEXT' | translate"
          (click)="nextMonth()"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
        <button mat-stroked-button (click)="goToday()">
          {{ 'DCA.CALENDAR.TODAY' | translate }}
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="cal-grid">
        @for (dow of dayLabels; track dow) {
          <div class="cal-grid__dow">{{ dow }}</div>
        }
        @for (cell of cells(); track cell.iso) {
          <div
            class="cal-cell"
            [class.cal-cell--muted]="!cell.inMonth"
            [class.cal-cell--today]="cell.iso === today"
          >
            <span class="cal-cell__date">{{ cell.date.getDate() }}</span>
            @for (
              item of remindersByDate().get(cell.iso) ?? [];
              track item.key
            ) {
              <div
                class="cal-chip"
                [class.cal-chip--due]="item.status === 'due'"
              >
                <span
                  class="cal-chip__label"
                  [matTooltip]="item.boardName + ' · ' + item.asset.name"
                >
                  {{ item.asset.name }}
                </span>
                <button
                  mat-icon-button
                  class="cal-chip__done"
                  [matTooltip]="'DCA.MARK_DONE' | translate"
                  [disabled]="saving().has(item.key)"
                  (click)="markDone(item)"
                >
                  <mat-icon>check_circle</mat-icon>
                </button>
              </div>
            }
          </div>
        }
      </div>

      @if (!loading() && reminders().length === 0) {
        <p class="cal-empty">{{ 'DCA.CALENDAR.EMPTY' | translate }}</p>
      }
    </div>
  `,
  styles: [
    `
      .page {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .page__header {
        margin-bottom: 20px;
      }
      .page__title {
        margin: 0 0 4px;
        font-size: 22px;
        font-weight: 700;
      }
      .page__subtitle {
        margin: 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 14px;
      }
      .cal-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .cal-toolbar__label {
        font-weight: 600;
        min-width: 160px;
        text-align: center;
      }
      .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: var(--mat-sys-outline-variant);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        overflow: hidden;
      }
      .cal-grid__dow {
        background: var(--mat-sys-surface-container-low);
        padding: 8px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
      }
      .cal-cell {
        background: var(--mat-sys-surface);
        min-height: 96px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .cal-cell--muted {
        background: var(--mat-sys-surface-container-lowest);
        color: var(--mat-sys-on-surface-variant);
      }
      .cal-cell--today {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: -2px;
      }
      .cal-cell__date {
        font-size: 12px;
        font-weight: 600;
      }
      .cal-chip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2px;
        padding: 2px 4px 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
      }
      .cal-chip--due {
        background: color-mix(in srgb, #ef4444 18%, transparent);
        color: #ef4444;
      }
      .cal-chip__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cal-chip__done {
        width: 20px;
        height: 20px;
        line-height: 20px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .cal-empty {
        margin-top: 16px;
        text-align: center;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
export class DcaCalendarComponent {
  private readonly api = inject(BoardApiService);
  private readonly lang = inject(LanguageService);

  readonly today = dateToIso(new Date());
  readonly dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  private readonly refresh = signal(0);
  private readonly loadState = signal<'loading' | 'loaded' | 'error'>(
    'loading',
  );

  private readonly boardsWithCategories = toSignal(
    toObservable(this.refresh).pipe(
      tap(() => this.loadState.set('loading')),
      switchMap(() => this.api.listBoards()),
      switchMap((boards) =>
        boards.length
          ? forkJoin(
              boards.map((board: BoardSummaryDto) =>
                this.api
                  .getCategories(board.id)
                  .pipe(map((cats) => ({ board, cats }))),
              ),
            )
          : of([]),
      ),
      tap(() => this.loadState.set('loaded')),
      catchError(() => {
        this.loadState.set('error');
        return of([]);
      }),
    ),
    { initialValue: [] },
  );

  loading = computed(() => this.loadState() === 'loading');

  reminders = computed<DcaReminderItem[]>(() => {
    const items: DcaReminderItem[] = [];
    for (const { board, cats } of this.boardsWithCategories()) {
      for (const cat of cats) {
        for (const asset of cat.assets) {
          const raw = asset.metadata?.[DCA_METADATA_KEY];
          if (!raw) continue;
          const schedule = raw as DcaSchedule;
          items.push({
            key: `${board.id}:${cat.id}:${asset.id}`,
            boardId: board.id,
            boardName: board.name,
            catId: cat.id,
            asset,
            schedule,
            status: dcaStatus(schedule, this.today),
            effectiveDate: effectiveDcaDate(schedule, this.today),
          });
        }
      }
    }
    return items;
  });

  remindersByDate = computed(() => {
    const map = new Map<string, DcaReminderItem[]>();
    for (const item of this.reminders()) {
      const arr = map.get(item.effectiveDate) ?? [];
      arr.push(item);
      map.set(item.effectiveDate, arr);
    }
    return map;
  });

  viewMonth = signal(startOfMonth(new Date()));
  cells = computed(() => buildMonthGrid(this.viewMonth()));

  monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(
      this.lang.currentLang() === 'vi' ? 'vi-VN' : 'en-US',
      { month: 'long', year: 'numeric' },
    ),
  );

  saving = signal<Set<string>>(new Set());

  prevMonth() {
    this.viewMonth.update((d) => addMonths(d, -1));
  }

  nextMonth() {
    this.viewMonth.update((d) => addMonths(d, 1));
  }

  goToday() {
    this.viewMonth.set(startOfMonth(new Date()));
  }

  markDone(item: DcaReminderItem) {
    this.setSaving(item.key, true);
    const schedule: DcaSchedule = {
      ...item.schedule,
      lastDoneDate: this.today,
    };
    this.api
      .updateAsset(item.boardId, item.catId, item.asset.id, {
        metadata: {
          ...(item.asset.metadata ?? {}),
          [DCA_METADATA_KEY]: schedule,
        },
      })
      .subscribe({
        next: () => {
          this.setSaving(item.key, false);
          this.refresh.update((n) => n + 1);
        },
        error: () => this.setSaving(item.key, false),
      });
  }

  private setSaving(key: string, value: boolean) {
    const next = new Set(this.saving());
    if (value) next.add(key);
    else next.delete(key);
    this.saving.set(next);
  }
}
