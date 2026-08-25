import { WORK_SCHEDULE } from './constants';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Menit dari tengah malam saat batas terlambat (jam masuk + toleransi). */
export function lateThresholdMinutes(): number {
  return (
    timeToMinutes(WORK_SCHEDULE.CHECK_IN_START) +
    WORK_SCHEDULE.LATE_THRESHOLD_MINUTES
  );
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** True jika check-in melewati batas terlambat. */
export function isLateCheckIn(recordedAt: string | Date): boolean {
  const d = typeof recordedAt === 'string' ? new Date(recordedAt) : recordedAt;
  return minutesOfDay(d) > lateThresholdMinutes();
}

export function formatWorkDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}
