'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHolidays, dateKeyOf } from '@/hooks/useHolidays';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';
import type { Attendance, User } from '@/types';

export default function DashboardPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const holidays = useHolidays();

  const now = new Date();
  const todayIsOff = now.getDay() === 0 || !!holidays.map[dateKeyOf(now)];

  const [employees, setEmployees] = useState<User[]>([]);
  const [todayAtt, setTodayAtt] = useState<Attendance[]>([]);
  const [weekData, setWeekData] = useState<{ label: string; hadir: number; terlambat: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 6 * 86400000);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const [{ data: users, error: usersErr }, { data: todayRows, error: todayErr }, { data: weekRows, error: weekErr }] =
          await Promise.all([
            supabase.from('users').select('*').eq('is_active', true),
            supabase
              .from('attendance')
              .select('*')
              .gte('recorded_at', `${today}T00:00:00`)
              .lte('recorded_at', `${today}T23:59:59`)
              .order('recorded_at', { ascending: false }),
            supabase
              .from('attendance')
              .select('recorded_at, is_late, type')
              .eq('type', 'check_in')
              .gte('recorded_at', `${weekAgoStr}T00:00:00`),
          ]);

        if (!cancelled) {
          if (usersErr || todayErr || weekErr) {
            console.error(
              'Gagal memuat dashboard:',
              usersErr?.message ?? todayErr?.message ?? weekErr?.message
            );
          }
          setEmployees((users as User[]) || []);
          setTodayAtt((todayRows as Attendance[]) || []);

          // Agregasi tren mingguan
          const byDay: Record<string, { hadir: Set<string>; terlambat: Set<string> }> = {};
          for (let i = 0; i < 7; i++) {
            const d = new Date(weekAgo.getTime() + i * 86400000);
            const key = d.toISOString().split('T')[0];
            byDay[key] = { hadir: new Set(), terlambat: new Set() };
          }
          for (const r of (weekRows as any[]) || []) {
            const key = r.recorded_at.split('T')[0];
            if (byDay[key]) {
              byDay[key].hadir.add(r.user_id ?? '');
              if (r.is_late) byDay[key].terlambat.add(r.user_id ?? '');
            }
          }
          setWeekData(
            Object.entries(byDay).map(([key, v]) => ({
              label: new Date(`${key}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' }),
              hadir: v.hadir.size,
              terlambat: v.terlambat.size,
            }))
          );
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const karyawanOnly = employees.filter((u) => u.role === 'karyawan');
    const checkIns = todayAtt.filter((a) => a.type === 'check_in');
    const checkedInIds = new Set(checkIns.map((a) => a.user_id));
    return {
      total: karyawanOnly.length,
      checkedIn: checkIns.filter((a) => checkedInIds.has(a.user_id) && karyawanOnly.some((u) => u.id === a.user_id)).length,
      late: checkIns.filter((a) => a.is_late === true).length,
      outArea: checkIns.filter((a) => a.is_within_geofence === false).length,
      notYetIds: karyawanOnly.filter((u) => !checkedInIds.has(u.id)),
    };
  }, [employees, todayAtt]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonList rows={6} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Karyawan', value: stats.total, icon: Users, cls: 'bg-primary/10 text-primary' },
    { label: 'Sudah Check-in', value: stats.checkedIn, icon: UserCheck, cls: 'bg-success-soft text-success' },
    {
      label: todayIsOff ? 'Belum Absen (Libur)' : 'Belum Check-in',
      value: todayIsOff ? 0 : stats.notYetIds.length,
      icon: UserX,
      cls: 'bg-warning-soft text-warning',
    },
    { label: 'Terlambat', value: stats.late, icon: Clock3, cls: 'bg-warning-soft text-warning' },
    { label: 'Di Luar Area', value: stats.outArea, icon: AlertTriangle, cls: 'bg-danger-soft text-danger' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageTitle title="Dashboard" description="Monitoring absensi hari ini" />

      {/* Stat cards - cleaner horizontal */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.cls}`}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold tabular-nums text-foreground leading-none">{s.value}</p>
              <p className="mt-1 text-xs leading-tight text-muted-foreground line-clamp-2">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Grafik mingguan */}
        <Card className="p-5 lg:col-span-3">
          <h3 className="mb-4 font-semibold text-foreground">Tren Kehadiran 7 Hari Terakhir</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={24} />
                <ChartTooltip
                  cursor={{ fill: 'var(--surface-muted)' }}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="hadir" name="Hadir" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="terlambat" name="Terlambat" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Belum absen */}
        <Card className="flex flex-col p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Belum Absen Hari Ini</h3>
            <Badge variant="warning">{stats.notYetIds.length}</Badge>
          </div>
          {todayIsOff ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Hari ini hari libur/Minggu — tidak ada kewajiban absen.
            </p>
          ) : stats.notYetIds.length === 0 ? (
            <p className="py-8 text-center text-sm text-success">
              🎉 Semua karyawan sudah absen hari ini.
            </p>
          ) : (
            <ul className="max-h-72 flex-1 space-y-1 overflow-y-auto pr-1">
              {stats.notYetIds.map((u) => (
                <li key={u.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-muted/60">
                  <Avatar name={u.full_name} src={u.photo_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{u.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/attendance"
            className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-border py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Lihat Rekap Absensi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>

      {/* Absensi terbaru */}
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-foreground">Absensi Terbaru</h3>
        {todayAtt.length === 0 ? (
          <EmptyState title="Belum ada aktivitas" description="Belum ada yang absen hari ini." />
        ) : (
          <ul className="divide-y divide-border">
            {todayAtt.slice(0, 8).map((r) => {
              const user = employees.find((u) => u.id === r.user_id);
              return (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={user?.full_name ?? '?'} src={user?.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{user?.full_name ?? 'Karyawan'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.type === 'check_in' ? 'Check In' : 'Check Out'}
                      {r.is_within_geofence === false ? ' · di luar area' : ''}
                    </p>
                  </div>
                  {r.type === 'check_in' && r.is_late && <Badge variant="warning">Terlambat</Badge>}
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {new Date(r.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
