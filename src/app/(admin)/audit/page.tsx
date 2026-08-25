'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableWrapper, Table, THead, TBody, TR, EmptyRow } from '@/components/ui/Table';
import type { AuditLog, User } from '@/types';

const PER_PAGE = 20;

const ACTION_LABELS: Record<string, string> = {
  check_in: 'Check In',
  check_out: 'Check Out',
  login: 'Login',
  logout: 'Logout',
  employee_created: 'Akun Dibuat',
  password_reset_by_admin: 'Reset Password',
  cron_delete_photos: 'Hapus Foto Otomatis',
};

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'default'> = {
  check_in: 'success',
  check_out: 'warning',
  login: 'primary',
  logout: 'default',
  employee_created: 'primary',
  password_reset_by_admin: 'danger',
  cron_delete_photos: 'default',
};

function describeAction(action: string, details?: Record<string, unknown> | null): string {
  const d = details ?? {};
  switch (action) {
    case 'check_in':
      return `Check-in di ${d.geofence_name ?? 'lokasi tidak dikenal'} (GPS ±${d.accuracy ?? '?'} m)${
        d.is_within_geofence === false ? ' — di luar area' : ''
      }${d.is_late === true ? ' — terlambat' : ''}`;
    case 'check_out':
      return `Check-out setelah bekerja ${d.work_duration_minutes ?? '?'} menit`;
    case 'employee_created':
      return `Akun baru dibuat (${d.email ?? '-'}) dengan role ${d.role ?? '-'}`;
    case 'password_reset_by_admin':
      return `Password direset oleh admin (${d.performed_by_role ?? 'admin'})`;
    case 'cron_delete_photos':
      return `Pembersihan otomatis: ${d.deleted ?? 0} foto dihapus dari Cloudinary`;
    default: {
      const entries = Object.entries(d);
      if (entries.length === 0) return '-';
      return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ');
    }
  }
}

export default function AuditPage() {
  const supabase = createClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const monthAgoStr = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];

  const [logs, setLogs] = useState<(AuditLog & { user?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [startDate, setStartDate] = useState(monthAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => setPage(1), [startDate, endDate, actionFilter]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('audit_log')
      .select('*, user:users(full_name)', { count: 'exact' })
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (actionFilter !== 'all') query = query.eq('action', actionFilter);

    const { data, error, count: total } = await query;
    if (error) console.error('Gagal memuat audit log:', error.message);
    setLogs((data as any) || []);
    setCount(total ?? 0);
    setLoading(false);
  }, [supabase, startDate, endDate, page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageTitle
        title="Audit Log"
        description="Riwayat aktivitas sistem (hanya baca — tidak dapat diubah)"
        action={
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Terlindungi
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:grid-cols-3">
        <Input label="Dari Tanggal" type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="Sampai Tanggal" type="date" value={endDate} min={startDate} max={todayStr} onChange={(e) => setEndDate(e.target.value)} />
        <Select label="Jenis Aksi" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="all">Semua Aksi</option>
          <option value="check_in">Check In</option>
          <option value="check_out">Check Out</option>
          <option value="employee_created">Akun Dibuat</option>
          <option value="password_reset_by_admin">Reset Password</option>
          <option value="cron_delete_photos">Hapus Foto Otomatis</option>
        </Select>
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={4} />
      ) : logs.length === 0 ? (
        <EmptyState title="Tidak ada aktivitas" description={`Tidak ada log pada rentang tanggal ini.`} />
      ) : (
        <>
          <TableWrapper>
            <Table>
              <THead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Detail</th>
                </tr>
              </THead>
              <TBody>
                {logs.map((log) => (
                  <TR key={log.id}>
                    <td className="whitespace-nowrap">
                      <p className="font-medium tabular-nums">
                        {new Date(log.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.user?.full_name ?? 'Sistem'} size="sm" />
                        <span className="font-medium">
                          {log.user?.full_name ?? 'Sistem'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={ACTION_VARIANTS[log.action] ?? 'default'}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </td>
                    <td className="max-w-sm text-sm text-muted-foreground">
                      {describeAction(log.action, log.details)}
                    </td>
                  </TR>
                ))}
                {logs.length === 0 && <EmptyRow colSpan={4}>Tidak ada data.</EmptyRow>}
              </TBody>
            </Table>
          </TableWrapper>

          <Pagination
            page={page}
            totalPages={Math.ceil(count / PER_PAGE)}
            onChange={setPage}
            totalItems={count}
            perPage={PER_PAGE}
          />
        </>
      )}
    </div>
  );
}
