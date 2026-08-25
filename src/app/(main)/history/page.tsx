'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Timer, TrendingUp, Download, X } from 'lucide-react';
import { PageTitle } from '@/components/shared/PageTitle';
import { PresenceCalendar } from '@/components/calendar/PresenceCalendar';
import { useMonthlyPresence, type DayPresence } from '@/hooks/useMonthlyPresence';
import { useHolidays } from '@/hooks/useHolidays';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Modal } from '@/components/shared/Modal';
import { formatWorkDuration } from '@/lib/attendance';
import type { Attendance } from '@/types';

export default function HistoryPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<DayPresence | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  // Kalender tidak bisa navigasi ke depan bulan ini
  const canGoNext = useMemo(
    () => year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1),
    [year, month, today]
  );

  const presence = useMonthlyPresence(year, month);
  const holidays = useHolidays();

  const dayRecords = selectedDay
    ? ([selectedDay.checkIn, selectedDay.checkOut].filter(Boolean) as Attendance[])
    : [];

  const dayList = Object.values(presence.days)
    .filter((d) => d.checkIn || d.checkOut)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const exportCsv = () => {
    const header = ['Tanggal', 'Check In', 'Terlambat', 'Check Out', 'Durasi (menit)'];
    const lines = dayList.map((d) => [
      d.dateKey,
      d.checkIn ? new Date(d.checkIn.recorded_at).toLocaleTimeString('id-ID') : '-',
      d.late ? 'Ya' : 'Tidak',
      d.checkOut ? new Date(d.checkOut.recorded_at).toLocaleTimeString('id-ID') : '-',
      d.checkIn && d.checkOut
        ? Math.round(
            (new Date(d.checkOut.recorded_at).getTime() - new Date(d.checkIn.recorded_at).getTime()) / 60000
          ).toString()
        : '-',
    ]);
    const csv =
      '\uFEFF' +
      [header, ...lines].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-absensi-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageTitle
        title="Riwayat Absensi"
        description="Kalender & rekap kehadiran Anda"
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={dayList.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      {/* Rekap */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: CalendarDays,
            label: 'Hadir',
            value: `${presence.summary.presentDays} hari`,
            color: 'text-success',
          },
          {
            icon: Clock3,
            label: 'Terlambat',
            value: `${presence.summary.lateDays} kali`,
            color: 'text-warning',
          },
          {
            icon: Timer,
            label: 'Rata-rata Kerja',
            value:
              presence.summary.avgWorkMinutes !== null
                ? formatWorkDuration(presence.summary.avgWorkMinutes)
                : '—',
            color: 'text-primary',
          },
          {
            icon: TrendingUp,
            label: 'Total Catatan',
            value: `${presence.summary.totalRecords}`,
            color: 'text-foreground',
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-2 text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kalender */}
        <Card className="p-5">
          <PresenceCalendar
            year={year}
            month={month}
            days={presence.days}
            leaves={presence.leaves}
            holidays={holidays.map}
            loading={presence.loading}
            onPrevMonth={() => {
              const d = new Date(year, month - 2, 1);
              setYear(d.getFullYear());
              setMonth(d.getMonth() + 1);
            }}
            onNextMonth={() => {
              const d = new Date(year, month, 1);
              setYear(d.getFullYear());
              setMonth(d.getMonth() + 1);
            }}
            canGoNext={canGoNext}
          />
        </Card>

        {/* List riwayat */}
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-foreground">Catatan Bulan Ini</h3>
          {presence.loading ? (
            <SkeletonList rows={6} />
          ) : dayList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada catatan absensi bulan ini.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {dayList.map((d) => (
                <li key={d.dateKey}>
                  <button
                    onClick={() => setSelectedDay(d)}
                    className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-2.5 text-left transition-colors hover:bg-surface-muted/60 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">
                        {new Date(`${d.dateKey}T00:00:00`).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {d.checkIn
                          ? `Masuk ${new Date(d.checkIn.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Tidak check-in'}
                        {d.checkOut &&
                          ` · Pulang ${new Date(d.checkOut.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {d.late && <Badge variant="warning">Terlambat</Badge>}
                      {!d.late && d.checkIn && <Badge variant="success">Hadir</Badge>}
                      {d.checkIn && d.checkOut && (
                        <Badge variant="primary" className="hidden sm:inline-flex">
                          {formatWorkDuration(
                            (new Date(d.checkOut.recorded_at).getTime() -
                              new Date(d.checkIn.recorded_at).getTime()) /
                              60000
                          )}
                        </Badge>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Detail hari */}
      <Modal open={!!selectedDay} onClose={() => setSelectedDay(null)} title="Detail Kehadiran">
        {selectedDay && (
          <div className="space-y-4">
            <p className="text-sm font-medium capitalize text-foreground">
              {new Date(`${selectedDay.dateKey}T00:00:00`).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {dayRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada catatan pada hari ini.</p>
            ) : (
              <div className="space-y-3">
                {dayRecords.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    {r.photo_url ? (
                      <button onClick={() => setZoomPhoto(r.photo_url!)} className="cursor-zoom-in flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo_url} alt="Selfie" className="h-14 w-14 rounded-lg object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
                        ?
                      </div>
                    )}
                    <div>
                      <Badge variant={r.type === 'check_in' ? 'success' : 'warning'}>
                        {r.type === 'check_in' ? 'Check In' : 'Check Out'}
                      </Badge>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {new Date(r.recorded_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.is_within_geofence === false
                          ? 'Di luar area'
                          : r.is_late
                            ? 'Terlambat'
                            : 'Tepat waktu'}
                      </p>
                    </div>
                  </div>
                ))}
                {selectedDay.checkIn && selectedDay.checkOut && (
                  <p className="rounded-xl bg-primary/10 p-3 text-center text-sm font-semibold text-primary">
                    Total kerja:{' '}
                    {formatWorkDuration(
                      (new Date(selectedDay.checkOut.recorded_at).getTime() -
                        new Date(selectedDay.checkIn.recorded_at).getTime()) /
                        60000
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Zoom foto */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6 fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomPhoto} alt="Selfie" className="max-h-full max-w-full rounded-xl object-contain" />
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
