import { WORK_SCHEDULE, DEFAULT_WORK_SCHEDULE } from './constants';
import type { WorkSchedule } from './schedule';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Menit dari tengah malam saat batas terlambat (jam masuk + toleransi). */
export function lateThresholdMinutes(schedule?: WorkSchedule): number {
  const s = schedule || DEFAULT_WORK_SCHEDULE as unknown as WorkSchedule & { checkInStart: string; lateThresholdMinutes: number };
  const start = (s as any).checkInStart || (s as any).CHECK_IN_START || WORK_SCHEDULE.CHECK_IN_START;
  const thr = (s as any).lateThresholdMinutes ?? (s as any).LATE_THRESHOLD_MINUTES ?? WORK_SCHEDULE.LATE_THRESHOLD_MINUTES;
  return timeToMinutes(start) + thr;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** True jika check-in melewati batas terlambat. */
export function isLateCheckIn(recordedAt: string | Date, schedule?: WorkSchedule): boolean {
  const d = typeof recordedAt === 'string' ? new Date(recordedAt) : recordedAt;
  return minutesOfDay(d) > lateThresholdMinutes(schedule);
}

export function formatWorkDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}
