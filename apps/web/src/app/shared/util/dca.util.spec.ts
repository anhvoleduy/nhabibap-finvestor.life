import { DcaSchedule } from '@nhabibap-myportfolio/shared-types';
import {
  dcaStatus,
  daysUntilDca,
  nextDcaDate,
  effectiveDcaDate,
} from './dca.util';

describe('dca.util', () => {
  describe('nextDcaDate', () => {
    it('returns anchor when never done', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-10' };
      expect(nextDcaDate(s)).toBe('2026-01-10');
    });

    it('adds a week from lastDone for WEEKLY', () => {
      const s: DcaSchedule = {
        frequency: 'WEEKLY',
        anchorDate: '2026-01-01',
        lastDoneDate: '2026-01-10',
      };
      expect(nextDcaDate(s)).toBe('2026-01-17');
    });

    it('adds two weeks for BIWEEKLY', () => {
      const s: DcaSchedule = {
        frequency: 'BIWEEKLY',
        anchorDate: '2026-01-01',
        lastDoneDate: '2026-01-10',
      };
      expect(nextDcaDate(s)).toBe('2026-01-24');
    });

    it('adds a month for MONTHLY', () => {
      const s: DcaSchedule = {
        frequency: 'MONTHLY',
        anchorDate: '2026-01-01',
        lastDoneDate: '2026-01-15',
      };
      expect(nextDcaDate(s)).toBe('2026-02-15');
    });

    it('adds a quarter for QUARTERLY', () => {
      const s: DcaSchedule = {
        frequency: 'QUARTERLY',
        anchorDate: '2026-01-01',
        lastDoneDate: '2026-01-15',
      };
      expect(nextDcaDate(s)).toBe('2026-04-15');
    });

    it('adds a year for YEARLY', () => {
      const s: DcaSchedule = {
        frequency: 'YEARLY',
        anchorDate: '2026-01-01',
        lastDoneDate: '2026-03-01',
      };
      expect(nextDcaDate(s)).toBe('2027-03-01');
    });

    it('adds intervalDays for CUSTOM', () => {
      const s: DcaSchedule = {
        frequency: 'CUSTOM',
        anchorDate: '2026-01-01',
        intervalDays: 10,
        lastDoneDate: '2026-01-10',
      };
      expect(nextDcaDate(s)).toBe('2026-01-20');
    });
  });

  describe('dcaStatus', () => {
    it('is due when next date is today or earlier', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-01' };
      expect(dcaStatus(s, '2026-01-05')).toBe('due');
      expect(dcaStatus(s, '2026-01-01')).toBe('due');
    });

    it('is upcoming when next date is in the future', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-02-01' };
      expect(dcaStatus(s, '2026-01-05')).toBe('upcoming');
    });
  });

  describe('daysUntilDca', () => {
    it('is positive for a future date', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-10' };
      expect(daysUntilDca(s, '2026-01-05')).toBe(5);
    });

    it('is negative when overdue', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-01' };
      expect(daysUntilDca(s, '2026-01-04')).toBe(-3);
    });
  });

  describe('effectiveDcaDate', () => {
    it('returns the scheduled date when it is still in the future', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-10' };
      expect(effectiveDcaDate(s, '2026-01-05')).toBe('2026-01-10');
    });

    it('returns the scheduled date when it is due exactly today', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-05' };
      expect(effectiveDcaDate(s, '2026-01-05')).toBe('2026-01-05');
    });

    it('rolls an overdue, undone reminder forward to today', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-01' };
      expect(effectiveDcaDate(s, '2026-01-04')).toBe('2026-01-04');
    });

    it('keeps rolling forward day by day while still missed', () => {
      const s: DcaSchedule = { frequency: 'WEEKLY', anchorDate: '2026-01-01' };
      expect(effectiveDcaDate(s, '2026-01-04')).toBe('2026-01-04');
      expect(effectiveDcaDate(s, '2026-01-05')).toBe('2026-01-05');
    });
  });
});
