'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import type { DayPresence } from '@/hooks/useMonthlyPresence';
import { cn } from '@/lib/utils';

const dayLabels = ['S', 'S', 'R', 'K', 'J', 'S', 'M']; // Minggu..Sabtu
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

type Status = 'present' | 'late' | 'none' | 'future' | 'leave' | 'off';

function getStatus(
  day: Date,
  days: Record<string, DayPresence>,
  todayKey: string,
  leaves?: Record<string, string>,
  holidays?: Record<string, string>
): Status {
  const key = dateKey(day);
  if (key > todayKey) return 'future';
  if (leaves?.[key]) return 'leave';
  // Minggu & hari libur bukan hari kerja
  if (day.getDay() === 0 || holidays?.[key]) return 'off';
  const presence = days[key];
  if (!presence?.checkIn) return 'none';
  return presence.late ? 'late' : 'present';
}

const statusStyles: Record<Status, string> = {
  present: 'bg-success text-white',
  late: 'bg-warning text-white',
  none: 'bg-danger-soft text-danger',
  future: 'text-muted-foreground/50',
  leave: 'bg-primary text-white',
  off: 'bg-surface-muted text-muted-foreground',
};

interface PresenceCalendarProps {
  year: number;
  month: number; // 1-12
  days: Record<string, DayPresence>;
  leaves?: Record<string, 'cuti' | 'izin' | 'sakit'>;
  holidays?: Record<string, string>;
  compact?: boolean;
  loading?: boolean;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canGoNext?: boolean;
}

export function PresenceCalendar({
  year,
  month,
  days,
  leaves,
  holidays,
  compact = false,
  loading = false,
  onPrevMonth,
  onNextMonth,
  canGoNext = true,
}: PresenceCalendarProps) {
  const today = new Date();
  const todayKey = dateKey(today);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Minggu
    const totalDays = new Date(year, month, 0).getDate();
    const arr: (Date | null)[] = Array.from({ length: firstDay }, () => null);
    for (let d = 1; d <= totalDays; d++) arr.push(new Date(year, month - 1, d));
    return arr;
  }, [year, month]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {monthNames[month - 1]} {year}
        </h3>
        {!compact && (
          <div className="flex gap-1">
            <button
              onClick={onPrevMonth}
              disabled={!onPrevMonth || loading}
              aria-label="Bulan sebelumnya"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={onNextMonth}
              disabled={!onNextMonth || !canGoNext || loading}
              aria-label="Bulan berikutnya"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-muted disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className={cn('grid grid-cols-7', compact ? 'gap-y-1' : 'gap-y-1.5')}>
        {dayLabels.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="flex h-7 items-center justify-center text-[11px] font-semibold uppercase text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;
          const status = getStatus(day, days, todayKey, leaves, holidays);
          const isToday = dateKey(day) === todayKey;
          return (
            <span key={dateKey(day)} className="flex items-center justify-center">
              <span
                title={
                  status === 'none'
                    ? 'Tidak hadir'
                    : status === 'late'
                      ? 'Terlambat'
                      : status === 'present'
                        ? 'Hadir'
                        : status === 'leave' && leaves?.[dateKey(day)]
                          ? `Cuti/Izin: ${leaves[dateKey(day)]}`
                          : undefined
                }
                className={cn(
                  'flex items-center justify-center rounded-full font-medium tabular-nums',
                  compact ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-sm',
                  statusStyles[status],
                  isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-[var(--surface)]'
                )}
              >
                {status === 'none' ? <Circle className="h-1.5 w-1.5 fill-current" /> : day.getDate()}
              </span>
            </span>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Hadir
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Terlambat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger-soft" /> Tidak hadir
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Cuti/Izin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-muted border border-border" />{' '}
            Libur/Minggu
          </span>
        </div>
      )}
    </div>
  );
}
