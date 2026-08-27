import { DEFAULT_WORK_SCHEDULE } from './constants';

export interface WorkSchedule {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
  lateThresholdMinutes: number;
}

export function parseSettingsToSchedule(rows: { key: string; value: string }[] | null): WorkSchedule {
  const map = new Map<string, string>();
  for (const r of rows || []) map.set(r.key, r.value);
  return {
    checkInStart: map.get('check_in_start') || DEFAULT_WORK_SCHEDULE.CHECK_IN_START,
    checkInEnd: map.get('check_in_end') || DEFAULT_WORK_SCHEDULE.CHECK_IN_END,
    checkOutStart: map.get('check_out_start') || DEFAULT_WORK_SCHEDULE.CHECK_OUT_START,
    checkOutEnd: map.get('check_out_end') || DEFAULT_WORK_SCHEDULE.CHECK_OUT_END,
    lateThresholdMinutes: parseInt(map.get('late_threshold_minutes') || String(DEFAULT_WORK_SCHEDULE.LATE_THRESHOLD_MINUTES), 10) || DEFAULT_WORK_SCHEDULE.LATE_THRESHOLD_MINUTES,
  };
}

export async function getWorkSchedule(serviceSupabase: { from: (t: string) => any }): Promise<WorkSchedule> {
  try {
    const { data } = await serviceSupabase.from('settings').select('key,value').in('key', ['check_in_start','check_in_end','check_out_start','check_out_end','late_threshold_minutes','use_shift_mode']);
    return parseSettingsToSchedule(data as any);
  } catch {
    return { ...DEFAULT_WORK_SCHEDULE, checkInStart: DEFAULT_WORK_SCHEDULE.CHECK_IN_START, checkInEnd: DEFAULT_WORK_SCHEDULE.CHECK_IN_END, checkOutStart: DEFAULT_WORK_SCHEDULE.CHECK_OUT_START, checkOutEnd: DEFAULT_WORK_SCHEDULE.CHECK_OUT_END, lateThresholdMinutes: DEFAULT_WORK_SCHEDULE.LATE_THRESHOLD_MINUTES };
  }
}

// Fase 2 shift-ready: resolver per user (sekarang fallback global)
export async function getWorkScheduleForUser(_userId: string, serviceSupabase: { from: (t: string) => any }): Promise<WorkSchedule> {
  // TODO Fase 10: if use_shift_mode then resolve shift_assignments -> shifts
  return getWorkSchedule(serviceSupabase);
}

export function getWorkScheduleClient(rows: { key: string; value: string }[] | null): WorkSchedule {
  return parseSettingsToSchedule(rows);
}

export function lateLabel(schedule: WorkSchedule): string {
  const [h, m] = schedule.checkInStart.split(':').map(Number);
  const total = h * 60 + m + schedule.lateThresholdMinutes;
  const lh = Math.floor(total / 60) % 24;
  const lm = total % 60;
  return `${String(lh).padStart(2,'0')}:${String(lm).padStart(2,'0')}`;
}
