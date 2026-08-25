'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Printer, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useHolidays, dateKeyOf } from '@/hooks/useHolidays';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TableWrapper, Table, THead, TBody, TR, EmptyRow } from '@/components/ui/Table';
import { formatWorkDuration } from '@/lib/attendance';
import type { Attendance, LeaveRequest, OvertimeRequest, User } from '@/types';

interface PayrollRow {
  user: User;
  hadir: number;
  terlambat: number;
  cutiIzin: number;
  lemburJam: number;
  totalMenit: number;
}

export default function PayrollPage() {
  const supabase = createClient();
  const holidays = useHolidays();

  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PayrollRow[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const startIso = start.toISOString();
    const endIso = new Date(end.getTime() + 86400000 - 1).toISOString();

    const [{ data: users }, { data: atts }, { data: leaves }, { data: overtimes }] =
      await Promise.all([
        supabase.from('users').select('*').eq('is_active', true).order('full_name'),
        supabase
          .from('attendance')
          .select('*')
          .gte('recorded_at', startIso)
          .lte('recorded_at', endIso),
        supabase
          .from('leave_requests')
          .select('*')
          .eq('status', 'approved')
          .lte('start_date', end.toISOString().split('T')[0])
          .gte('end_date', start.toISOString().split('T')[0]),
        supabase
          .from('overtime_requests')
          .select('*')
          .eq('status', 'approved')
          .gte('work_date', start.toISOString().split('T')[0])
          .lte('work_date', end.toISOString().split('T')[0]),
      ]);

    const userList = (users as User[]) || [];
    const attendance = (atts as Attendance[]) || [];
    const leavesList = (leaves as LeaveRequest[]) || [];
    const overtimeList = (overtimes as OvertimeRequest[]) || [];

    const result: PayrollRow[] = userList.map((user) => {
      const userAtt = attendance.filter((a) => a.user_id === user.id);
      const checkIns = userAtt.filter((a) => a.type === 'check_in');
      const hadir = checkIns.length;
      const terlambat = checkIns.filter((a) => a.is_late === true).length;

      const totalMenit = userAtt
        .filter((a) => a.type === 'check_out' && a.work_duration_minutes != null)
        .reduce((sum, a) => sum + (a.work_duration_minutes ?? 0), 0);

      // Hari cuti/izin dalam bulan ini
      let cutiIzin = 0;
      for (const l of leavesList.filter((x) => x.user_id === user.id && x.type !== 'sakit')) {
        const s = new Date(Math.max(new Date(`${l.start_date}T00:00:00`).getTime(), start.getTime()));
        const e = new Date(Math.min(new Date(`${l.end_date}T00:00:00`).getTime(), end.getTime()));
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          cutiIzin++;
        }
      }

      const lemburJam = overtimeList
        .filter((o) => o.user_id === user.id)
        .reduce((sum, o) => sum + Number(o.planned_hours), 0);

      return { user, hadir, terlambat, cutiIzin, lemburJam, totalMenit };
    });

    setRows(result);
    setLoading(false);
  }, [supabase, month]);

  useMemo(() => {
    fetchData();
  }, [fetchData]);

  const [y, m] = month.split('-').map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const exportCsv = () => {
    const header = ['Nama', 'Email', 'Role', 'Hadir (hari)', 'Terlambat (kali)', 'Cuti/Izin (hari)', 'Lembur (jam)', 'Total Kerja (jam)'];
    const lines = rows.map((r) => [
      r.user.full_name,
      r.user.email,
      r.user.role,
      String(r.hadir),
      String(r.terlambat),
      String(r.cutiIzin),
      String(r.lemburJam),
      (r.totalMenit / 60).toFixed(1),
    ]);
    const csv =
      '\uFEFF' +
      [`Rekap Gaji ${monthName}`, ...[header, ...lines].map((row) => row.map((c) => `"${c}"`).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-gaji-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageTitle
        title="Rekap Gaji"
        description={`Rekapitulasi kehadiran untuk perhitungan gaji — ${monthName}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()} disabled={rows.length === 0}>
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="max-w-xs">
        <Input label="Pilih Bulan" type="month" value={month} max={dateKeyOf(new Date()).slice(0, 7)} onChange={(e) => setMonth(e.target.value)} />
      </div>

      {loading || holidays.loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : rows.length === 0 ? (
        <EmptyState title="Belum ada karyawan" />
      ) : (
        <TableWrapper>
          <Table className="min-w-[760px]">
            <THead>
              <tr>
                <th>Karyawan</th>
                <th className="text-center">Hadir</th>
                <th className="text-center">Terlambat</th>
                <th className="text-center">Cuti/Izin</th>
                <th className="text-center">Lembur</th>
                <th className="text-center">Total Kerja</th>
                <th className="text-right">Detail</th>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user.full_name} src={r.user.photo_url} size="sm" />
                      <div>
                        <p className="font-medium">{r.user.full_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{r.user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <Badge variant={r.hadir > 0 ? 'success' : 'default'}>{r.hadir} hari</Badge>
                  </td>
                  <td className="text-center">
                    <Badge variant={r.terlambat > 0 ? 'warning' : 'default'}>{r.terlambat}x</Badge>
                  </td>
                  <td className="text-center">{r.cutiIzin} hari</td>
                  <td className="text-center">{r.lemburJam > 0 ? `${r.lemburJam} jam` : '-'}</td>
                  <td className="text-center font-semibold">
                    {r.totalMenit > 0 ? formatWorkDuration(r.totalMenit) : '-'}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/employees/${r.user.id}`}
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                    >
                      Riwayat <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </TR>
              ))}
              {rows.length === 0 && <EmptyRow colSpan={7}>Tidak ada data.</EmptyRow>}
            </TBody>
          </Table>
        </TableWrapper>
      )}
    </div>
  );
}
