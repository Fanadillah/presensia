import { describe, it, expect } from 'vitest';
import { isLateCheckIn, formatWorkDuration, lateThresholdMinutes, minutesOfDay } from './attendance';
import { WORK_SCHEDULE } from './constants';

describe('attendance helpers', () => {
  it('lateThresholdMinutes = 08:00 + 15 = 495 menit (08:15)', () => {
    expect(lateThresholdMinutes()).toBe(8 * 60 + 15);
    expect(WORK_SCHEDULE.CHECK_IN_START).toBe('08:00');
    expect(WORK_SCHEDULE.LATE_THRESHOLD_MINUTES).toBe(15);
  });

  it('minutesOfDay', () => {
    expect(minutesOfDay(new Date('2026-08-26T08:14:00'))).toBe(8 * 60 + 14);
    expect(minutesOfDay(new Date('2026-08-26T00:00:00'))).toBe(0);
    expect(minutesOfDay(new Date('2026-08-26T23:59:00'))).toBe(23 * 60 + 59);
  });

  it('isLateCheckIn false jika <= 08:15', () => {
    expect(isLateCheckIn(new Date('2026-08-26T08:00:00'))).toBe(false);
    expect(isLateCheckIn(new Date('2026-08-26T08:15:00'))).toBe(false);
    expect(isLateCheckIn('2026-08-26T08:15:00')).toBe(false);
  });

  it('isLateCheckIn true jika > 08:15', () => {
    expect(isLateCheckIn(new Date('2026-08-26T08:16:00'))).toBe(true);
    expect(isLateCheckIn(new Date('2026-08-26T09:00:00'))).toBe(true);
    expect(isLateCheckIn('2026-08-26T08:30:00')).toBe(true);
  });

  it('formatWorkDuration', () => {
    expect(formatWorkDuration(0)).toBe('0m');
    expect(formatWorkDuration(30)).toBe('30m');
    expect(formatWorkDuration(60)).toBe('1j');
    expect(formatWorkDuration(90)).toBe('1j 30m');
    expect(formatWorkDuration(125)).toBe('2j 5m');
    expect(formatWorkDuration(480)).toBe('8j');
  });
});
