'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isLateCheckIn } from '@/lib/attendance';
import type { Attendance } from '@/types';

export interface DayPresence {
  dateKey: string; // yyyy-mm-dd
  checkIn: Attendance | null;
  checkOut: Attendance | null;
  late: boolean;
}

export interface MonthlyPresence {
  loading: boolean;
  error: string | null;
  days: Record<string, DayPresence>;
  leaves: Record<string, 'cuti' | 'izin' | 'sakit'>; // dateKey -> jenis
  summary: {
    presentDays: number;
    lateDays: number;
    avgWorkMinutes: number | null;
    totalRecords: number;
    leaveDays: number;
  };
}

export function useMonthlyPresence(year: number, month: number, targetUserId?: string): MonthlyPresence {
  const [state, setState] = useState<MonthlyPresence>({
    loading: true,
    error: null,
    days: {},
    leaves: {},
    summary: { presentDays: 0, lateDays: 0, avgWorkMinutes: null, totalRecords: 0, leaveDays: 0 },
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchMonth() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const supabase = createClient();
        let userId = targetUserId;
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Tidak terautentikasi');
          userId = user.id;
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userId)
          .gte('recorded_at', start.toISOString())
          .lte('recorded_at', new Date(end.getTime() + 24 * 3600 * 1000 - 1).toISOString())
          .order('recorded_at', { ascending: true });

        if (error) throw error;

        // Cuti/izin/sakit yang disetujui (tabel mungkin belum ada)
        const leaves: Record<string, 'cuti' | 'izin' | 'sakit'> = {};
        const { data: leaveRows, error: leaveErr } = await supabase
          .from('leave_requests')
          .select('type, start_date, end_date')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .lte('start_date', end.toISOString().split('T')[0])
          .gte('end_date', start.toISOString().split('T')[0]);

        let leaveDays = 0;
        if (!leaveErr && leaveRows) {
          for (const l of leaveRows as any[]) {
            const s = new Date(Math.max(new Date(`${l.start_date}T00:00:00`).getTime(), start.getTime()));
            const e = new Date(Math.min(new Date(`${l.end_date}T00:00:00`).getTime(), end.getTime()));
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
              const key = d.toLocaleDateString('sv-SE');
              leaves[key] = l.type;
              leaveDays++;
            }
          }
        }

        const days: Record<string, DayPresence> = {};
        for (const rec of (data as Attendance[]) || []) {
          const key = new Date(rec.recorded_at).toLocaleDateString('sv-SE'); // yyyy-mm-dd local
          if (!days[key]) {
            days[key] = { dateKey: key, checkIn: null, checkOut: null, late: false };
          }
          if (rec.type === 'check_in') {
            days[key].checkIn = rec;
            days[key].late =
              typeof rec.is_late === 'boolean' ? rec.is_late : isLateCheckIn(rec.recorded_at);
          } else if (rec.type === 'check_out') {
            days[key].checkOut = rec;
          }
        }

        const dayList = Object.values(days);
        const presentDays = dayList.filter((d) => d.checkIn).length;
        const lateDays = dayList.filter((d) => d.late).length;
        const durations = dayList
          .filter((d) => d.checkIn && d.checkOut)
          .map(
            (d) =>
              (new Date(d.checkOut!.recorded_at).getTime() -
                new Date(d.checkIn!.recorded_at).getTime()) /
              60000
          );
        const avgWorkMinutes =
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : null;

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            days,
            leaves,
            summary: {
              presentDays,
              lateDays,
              avgWorkMinutes,
              totalRecords: (data as Attendance[])?.length ?? 0,
              leaveDays,
            },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Gagal memuat data bulanan',
          }));
        }
      }
    }

    fetchMonth();
    return () => {
      cancelled = true;
    };
  }, [year, month, targetUserId]);

  return state;
}
