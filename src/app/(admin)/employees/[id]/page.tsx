'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, Timer, PlaneTakeoff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMonthlyPresence } from '@/hooks/useMonthlyPresence';
import { useHolidays } from '@/hooks/useHolidays';
import { PresenceCalendar } from '@/components/calendar/PresenceCalendar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { formatWorkDuration } from '@/lib/attendance';
import type { Attendance, User } from '@/types';

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supabase = createClient();
  const holidays = useHolidays();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<{
    checkIn: Attendance | null;
    checkOut: Attendance | null;
    dateKey: string;
  } | null>(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const presence = useMonthlyPresence(year, month, id);

  useState(() => {
    (async () => {
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      setProfile((data as User) || null);
      setProfileLoading(false);
    })();
  });

  const canGoNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth() + 1);

  const dayList = Object.values(presence.days)
    .filter((d) => d.checkIn || d.checkOut)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const dayRecords = selectedDay
    ? ([selectedDay.checkIn, selectedDay.checkOut].filter(Boolean) as Attendance[])
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Profil ringkas */}
      {profileLoading ? (
        <SkeletonList rows={1} />
      ) : profile ? (
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <Avatar name={profile.full_name} src={profile.photo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground">{profile.full_name}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="primary" className="capitalize">{profile.role}</Badge>
            <Badge variant={profile.is_active ? 'success' : 'danger'}>
              {profile.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </Card>
      ) : (
        <EmptyState title="Karyawan tidak ditemukan" />
      )}

      {/* Rekap bulan ini */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: 'Hadir', value: `${presence.summary.presentDays} hari`, color: 'text-success' },
          { icon: Clock3, label: 'Terlambat', value: `${presence.summary.lateDays}x`, color: 'text-warning' },
          {
            icon: Timer,
            label: 'Rata-rata Kerja',
            value: presence.summary.avgWorkMinutes !== null ? formatWorkDuration(presence.summary.avgWorkMinutes) : '—',
            color: 'text-primary',
          },
          { icon: PlaneTakeoff, label: 'Cuti/Izin', value: `${presence.summary.leaveDays} hari`, color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="mt-2 text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
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
                      {d.late ? <Badge variant="warning">Terlambat</Badge> : d.checkIn && <Badge variant="success">Hadir</Badge>}
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
                        {new Date(r.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
              </div>
            )}
          </div>
        )}
      </Modal>

      {zoomPhoto && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 p-6 fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomPhoto} alt="Selfie" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
