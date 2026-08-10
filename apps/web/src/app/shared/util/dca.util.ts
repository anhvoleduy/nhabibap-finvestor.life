import { DcaSchedule } from '@nhabibap-myportfolio/shared-types';

export type DcaStatus = 'due' | 'upcoming';

const MS_PER_DAY = 86_400_000;

/** Parse ISO yyyy-mm-dd as a UTC date (TZ-stable). */
function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Add one interval of `schedule.frequency` to an ISO date. */
function addInterval(iso: string, schedule: DcaSchedule): string {
  const d = parseIso(iso);
  switch (schedule.frequency) {
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'BIWEEKLY':
      d.setUTCDate(d.getUTCDate() + 14);
      break;
    case 'MONTHLY':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'QUARTERLY':
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case 'YEARLY':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    case 'CUSTOM':
      d.setUTCDate(d.getUTCDate() + Math.max(1, schedule.intervalDays ?? 1));
      break;
  }
  return toIso(d);
}

/**
 * Next scheduled DCA date (ISO yyyy-mm-dd).
 * Once completed at least once, next = lastDoneDate + interval; otherwise the anchor.
 */
export function nextDcaDate(schedule: DcaSchedule): string {
  return schedule.lastDoneDate
    ? addInterval(schedule.lastDoneDate, schedule)
    : schedule.anchorDate;
}

/** 'due' when next DCA date is today or earlier, else 'upcoming'. */
export function dcaStatus(schedule: DcaSchedule, todayIso: string): DcaStatus {
  return nextDcaDate(schedule) <= todayIso ? 'due' : 'upcoming';
}

/** Whole days until next DCA (negative = overdue). */
export function daysUntilDca(schedule: DcaSchedule, todayIso: string): number {
  return Math.round(
    (parseIso(nextDcaDate(schedule)).getTime() - parseIso(todayIso).getTime()) /
      MS_PER_DAY,
  );
}

/**
 * Date to show the reminder on for a given day.
 * A missed reminder (next date in the past, not yet done) rolls forward to
 * today — recomputed daily, so it keeps moving to "next day" until done.
 */
export function effectiveDcaDate(
  schedule: DcaSchedule,
  todayIso: string,
): string {
  const next = nextDcaDate(schedule);
  return next < todayIso ? todayIso : next;
}
