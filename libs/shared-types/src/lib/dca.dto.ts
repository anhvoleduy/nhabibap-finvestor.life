// DCA (Dollar-Cost Averaging) reminder schedule.
// Stored inside Asset.metadata under DCA_METADATA_KEY — no dedicated column.
// Web computes next-due date + status from this shape; API just persists it.

export type DcaFrequency =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'CUSTOM';

export interface DcaSchedule {
  /** How often to DCA. Any frequency allowed for any asset type. */
  frequency: DcaFrequency;
  /** First scheduled DCA date, ISO yyyy-mm-dd. */
  anchorDate: string;
  /** Day count between buys; required when frequency === 'CUSTOM'. */
  intervalDays?: number;
  /** Last completed DCA date, ISO yyyy-mm-dd. Drives next-due once set. */
  lastDoneDate?: string;
}

/** Key under Asset.metadata holding the DcaSchedule. */
export const DCA_METADATA_KEY = 'dca';
