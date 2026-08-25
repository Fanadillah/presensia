'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function format(date: Date, withDay: boolean): string {
  const day = days[date.getDay()];
  const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
  return withDay ? `${day}, ${dateStr} · ${time}` : `${dateStr} · ${time}`;
}

export function LiveClock({ className, withDay = true }: { className?: string; withDay?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn('leading-tight', className)}>
      <p className="font-mono text-xl font-bold tracking-wide text-white tabular-nums">
        {now
          ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          : '--:--'}
      </p>
      <p className="text-xs text-slate-400">
        {now ? format(now, withDay).split('· ')[1] : 'Memuat…'}
      </p>
    </div>
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
