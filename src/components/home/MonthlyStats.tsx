'use client';

import { CalendarCheck2, Clock3, Timer } from 'lucide-react';
import { useMonthlyPresence } from '@/hooks/useMonthlyPresence';
import { formatWorkDuration } from '@/lib/attendance';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function MonthlyStats() {
  const now = new Date();
  const { loading, summary, error } = useMonthlyPresence(now.getFullYear(), now.getMonth() + 1);

  if (loading) return <SkeletonCard />;
  if (error) return null;

  const items = [
    {
      icon: CalendarCheck2,
      label: 'Hadir',
      value: `${summary.presentDays} hari`,
      color: 'text-success',
      bg: 'bg-success-soft',
    },
    {
      icon: Clock3,
      label: 'Terlambat',
      value: `${summary.lateDays} kali`,
      color: 'text-warning',
      bg: 'bg-warning-soft',
    },
    {
      icon: Timer,
      label: 'Rata-rata Kerja',
      value:
        summary.avgWorkMinutes !== null
          ? formatWorkDuration(summary.avgWorkMinutes)
          : '—',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Statistik Bulan Ini
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-card border border-border bg-surface p-4 shadow-card"
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}
            >
              <item.icon className={`h-[18px] w-[18px] ${item.color}`} />
            </span>
            <p className="mt-2.5 text-lg font-bold text-foreground sm:text-xl">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
