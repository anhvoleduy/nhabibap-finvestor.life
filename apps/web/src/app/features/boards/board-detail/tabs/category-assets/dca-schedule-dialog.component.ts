import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  AssetDto,
  DcaFrequency,
  DcaSchedule,
  DCA_METADATA_KEY,
} from '@nhabibap-myportfolio/shared-types';
import { BoardApiService } from '../../../../../core/board-api.service';
import { nextDcaDate } from '../../../../../shared/util/dca.util';
import { dateToIso, isoToDate } from '../../../../../shared/util/date.util';

export interface DcaScheduleDialogData {
  boardId: string;
  catId: string;
  asset: AssetDto;
}

const FREQUENCIES: DcaFrequency[] = [
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dca-schedule-dialog',
  standalone: true,
  // en-GB -> dd/mm/yyyy display, matching the previous native date input.
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ 'DCA.TITLE' | translate: { name: data.asset.name } }}
    </h2>

    <mat-dialog-content style="min-width:420px">
      <form [formGroup]="form" class="dca-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'DCA.FREQUENCY' | translate }}</mat-label>
          <mat-select formControlName="frequency">
            @for (f of frequencies; track f) {
              <mat-option [value]="f">
                {{ 'DCA.FREQ.' + f | translate }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (form.controls.frequency.value === 'CUSTOM') {
          <mat-form-field appearance="outline">
            <mat-label>{{ 'DCA.INTERVAL_DAYS' | translate }}</mat-label>
            <input
              matInput
              type="number"
              min="1"
              formControlName="intervalDays"
            />
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>{{ 'DCA.ANCHOR_DATE' | translate }}</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            formControlName="anchorDate"
            (click)="picker.open()"
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
        </mat-form-field>
      </form>

      <div class="dca-next">
        <span class="dca-next__label">{{ 'DCA.NEXT' | translate }}</span>
        <span class="dca-next__value">{{ nextDatePreview() ?? '—' }}</span>
      </div>

      @if (lastDoneDate()) {
        <div class="dca-next">
          <span class="dca-next__label">{{ 'DCA.LAST_DONE' | translate }}</span>
          <span class="dca-next__value">{{ lastDoneDate() }}</span>
        </div>
      }

      <button
        mat-stroked-button
        type="button"
        class="dca-done-btn"
        [disabled]="saving()"
        (click)="markDoneToday()"
      >
        <mat-icon>check_circle</mat-icon> {{ 'DCA.MARK_DONE' | translate }}
      </button>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (hasExisting()) {
        <button
          mat-button
          color="warn"
          [disabled]="saving()"
          (click)="remove()"
        >
          {{ 'DCA.REMOVE' | translate }}
        </button>
      }
      <button mat-button [disabled]="saving()" (click)="close()">
        {{ 'COMMON.CANCEL' | translate }}
      </button>
      <button
        mat-flat-button
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        {{ 'COMMON.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dca-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 8px;
      }
      .dca-next {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 14px;
      }
      .dca-next__label {
        color: var(--mat-sys-on-surface-variant);
      }
      .dca-next__value {
        font-weight: 600;
      }
      .dca-done-btn {
        margin-top: 12px;
        width: 100%;
      }
    `,
  ],
})
export class DcaScheduleDialogComponent {
  readonly data = inject<DcaScheduleDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<DcaScheduleDialogComponent>);
  private readonly api = inject(BoardApiService);
  private readonly fb = inject(FormBuilder);

  readonly frequencies = FREQUENCIES;
  readonly today = new Date().toISOString().slice(0, 10);

  private readonly existing = this.readSchedule();

  hasExisting = signal(!!this.existing);
  lastDoneDate = signal<string | undefined>(this.existing?.lastDoneDate);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    frequency: [
      (this.existing?.frequency ?? 'MONTHLY') as DcaFrequency,
      Validators.required,
    ],
    intervalDays: [this.existing?.intervalDays ?? 30, [Validators.min(1)]],
    anchorDate: [
      this.existing?.anchorDate
        ? isoToDate(this.existing.anchorDate)
        : new Date(),
      Validators.required,
    ],
  });

  private readonly formValue = signal(this.form.getRawValue());

  nextDatePreview = computed(() => {
    const v = this.formValue();
    if (!v.anchorDate) return null;
    return nextDcaDate(this.buildSchedule(v));
  });

  constructor() {
    this.form.valueChanges.subscribe(() =>
      this.formValue.set(this.form.getRawValue()),
    );
  }

  private readSchedule(): DcaSchedule | undefined {
    const raw = this.data.asset.metadata?.[DCA_METADATA_KEY];
    return raw ? (raw as DcaSchedule) : undefined;
  }

  private buildSchedule(v: {
    frequency: DcaFrequency;
    intervalDays: number;
    anchorDate: Date;
  }): DcaSchedule {
    const schedule: DcaSchedule = {
      frequency: v.frequency,
      anchorDate: dateToIso(v.anchorDate),
    };
    if (v.frequency === 'CUSTOM') schedule.intervalDays = v.intervalDays;
    const last = this.lastDoneDate();
    if (last) schedule.lastDoneDate = last;
    return schedule;
  }

  markDoneToday() {
    this.lastDoneDate.set(this.today);
    this.formValue.set(this.form.getRawValue());
  }

  save() {
    if (this.form.invalid) return;
    const schedule = this.buildSchedule(this.form.getRawValue());
    this.persist({
      ...(this.data.asset.metadata ?? {}),
      [DCA_METADATA_KEY]: schedule,
    });
  }

  remove() {
    const meta = { ...(this.data.asset.metadata ?? {}) };
    delete meta[DCA_METADATA_KEY];
    this.persist(meta);
  }

  private persist(metadata: Record<string, unknown>) {
    this.saving.set(true);
    this.api
      .updateAsset(this.data.boardId, this.data.catId, this.data.asset.id, {
        metadata,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.ref.close(true);
        },
        error: () => this.saving.set(false),
      });
  }

  close() {
    this.ref.close(false);
  }
}
