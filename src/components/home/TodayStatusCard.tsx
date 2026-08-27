'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useNow } from '@/components/shared/LiveClock';
import { formatWorkDuration, isLateCheckIn } from '@/lib/attendance';
import { createClient } from '@/lib/supabase/client';
import { getWorkScheduleClient, lateLabel, type WorkSchedule } from '@/lib/schedule';
import { Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function TodayStatusCard() {
  const { getToday } = useAttendance();
  const now = useNow(30000);
  const [today, setToday] = useState<Awaited<ReturnType<typeof getToday>>>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null);

  useEffect(() => {
    let cancelled = false;
    getToday().then((data) => {
      if (!cancelled) {
        setToday(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getToday, now]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('settings').select('key,value').in('key', ['check_in_start','check_in_end','late_threshold_minutes']).then(({ data }: { data: any }) => {
      setSchedule(getWorkScheduleClient(data as any));
    });
  }, []);

  if (loading) return <SkeletonCard />;

  const done = today?.has_check_in && today?.has_check_out;
  const checkedInOnly = today?.has_check_in && !today?.has_check_out;

  let duration: string | null = null;
  if (today?.check_in && today?.check_out) {
    duration = formatWorkDuration(
      (new Date(today.check_out.recorded_at).getTime() -
        new Date(today.check_in.recorded_at).getTime()) /
        60000
    );
  }

  const fmt = (s?: string) =>
    s
      ? new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '—';

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Absensi Hari Ini</h2>
            {schedule && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Clock3 className="h-3 w-3" />
                {schedule.checkInStart} • Telat &gt;{lateLabel(schedule)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Check In</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {fmt(today?.check_in?.recorded_at)}
                </span>
                {today?.check_in && isLateCheckIn(today.check_in.recorded_at, schedule || undefined) && (
                  <Badge variant="warning">Terlambat</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check Out</p>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {fmt(today?.check_out?.recorded_at)}
              </span>
            </div>
            {duration && (
              <div>
                <p className="text-xs text-muted-foreground">Durasi Kerja</p>
                <span className="text-lg font-bold text-success">{duration}</span>
              </div>
            )}
          </div>

          {done ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Absensi hari ini sudah lengkap. Terima kasih!
            </p>
          ) : checkedInOnly ? (
            <p className="text-sm text-muted-foreground">
              Jangan lupa check-out sebelum pulang.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Anda belum absen hari ini.
            </p>
          )}
        </div>

        {!done && (
          <Link
            href="/absen"
            className={`group flex flex-col items-center justify-center gap-1 rounded-2xl px-8 py-5 font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97] cursor-pointer ${
              checkedInOnly
                ? 'bg-gradient-to-br from-warning to-orange-600 shadow-warning/30'
                : 'bg-gradient-to-br from-primary to-primary-hover shadow-primary/30'
            }`}
          >
            <span className="flex items-center gap-2 text-lg">
              {checkedInOnly ? <LogOut className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
              {checkedInOnly ? 'Check Out' : 'Absen Sekarang'}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium opacity-80">
              Foto + GPS
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {done && (
          <Link
            href="/history"
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted cursor-pointer"
          >
            Lihat Riwayat
          </Link>
        )}
      </div>
    </section>
  );
}
