'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Search, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableWrapper, Table, THead, TBody, TR, EmptyRow } from '@/components/ui/Table';
import { formatWorkDuration } from '@/lib/attendance';
import type { Attendance, User, Geofence } from '@/types';

const PER_PAGE = 15;

type TypeFilter = 'all' | 'check_in' | 'check_out';
type StatusFilter = 'all' | 'in_area' | 'out_area' | 'late' | 'on_time';

export default function AttendancePage() {
  const supabase = createClient();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const monthAgoStr = useMemo(
    () => new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0],
    []
  );

  const [records, setRecords] = useState<(Attendance & { user?: User; geofence?: Geofence })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter
  const [startDate, setStartDate] = useState(monthAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [startDate, endDate, debouncedSearch, typeFilter, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('attendance')
      .select('*, user:users(*), geofence:geofence_id(id, name)', { count: 'exact' })
      .gte('recorded_at', `${startDate}T00:00:00`)
      .lte('recorded_at', `${endDate}T23:59:59`)
      .order('recorded_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (debouncedSearch) {
      query = query.ilike('users.full_name', `%${debouncedSearch}%`);
    }
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data, error, count: total } = await query;
    if (error) console.error('Gagal memuat absensi:', error.message);

    let rows = (data as any) || [];
    if (statusFilter === 'in_area') rows = rows.filter((r: any) => r.is_within_geofence === true);
    else if (statusFilter === 'out_area') rows = rows.filter((r: any) => r.is_within_geofence === false);
    else if (statusFilter === 'late') rows = rows.filter((r: any) => r.type === 'check_in' && r.is_late === true);
    else if (statusFilter === 'on_time') rows = rows.filter((r: any) => r.type === 'check_in' && r.is_late === false);

    setRecords(rows);
    setCount(total ?? 0);
    setLoading(false);
  }, [supabase, startDate, endDate, page, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = () => {
    const header = ['Tanggal', 'Nama', 'Tipe', 'Waktu', 'Status Lokasi', 'Terlambat', 'Durasi (menit)', 'Geofence'];
    const lines = records.map((r) => [
      new Date(r.recorded_at).toLocaleDateString('id-ID'),
      r.user?.full_name ?? '-',
      r.type === 'check_in' ? 'Check In' : 'Check Out',
      new Date(r.recorded_at).toLocaleTimeString('id-ID'),
      r.is_within_geofence ? 'Dalam area' : 'Di luar area',
      r.type === 'check_in' ? (r.is_late ? 'Ya' : 'Tidak') : '',
      r.work_duration_minutes?.toString() ?? '',
      r.geofence?.name ?? '',
    ]);
    const csv =
      '\uFEFF' +
      [header, ...lines].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-absensi-${startDate}_sd_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageTitle
        title="Rekap Absensi"
        description="Data absensi seluruh karyawan"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.print()} disabled={records.length === 0}>
              <Printer className="h-4 w-4" />
              Cetak PDF
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={records.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter */}
      <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:grid-cols-3 lg:grid-cols-5">
        <Input
          label="Dari Tanggal"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Sampai Tanggal"
          type="date"
          value={endDate}
          min={startDate}
          max={todayStr}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Input
          label="Cari Nama"
          placeholder="Nama karyawan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select label="Tipe" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}>
          <option value="all">Semua</option>
          <option value="check_in">Check In</option>
          <option value="check_out">Check Out</option>
        </Select>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Semua</option>
          <option value="in_area">Dalam Area</option>
          <option value="out_area">Di Luar Area</option>
          <option value="late">Terlambat</option>
          <option value="on_time">Tepat Waktu</option>
        </Select>
      </div>

      {/* Tabel */}
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : records.length === 0 ? (
        <EmptyState
          title="Tidak ada data"
          description={`Tidak ada absensi yang cocok dengan filter (${startDate} s/d ${endDate}).`}
        />
      ) : (
        <TableWrapper>
          <Table>
            <THead>
              <tr>
                <th>Karyawan</th>
                <th>Tipe</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Lokasi</th>
                <th>Foto</th>
              </tr>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.user?.full_name ?? '?'} size="sm" />
                      <div>
                        <p className="font-medium">{r.user?.full_name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{r.user?.role}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={r.type === 'check_in' ? 'success' : 'warning'}>
                      {r.type === 'check_in' ? 'Check In' : 'Check Out'}
                    </Badge>
                  </td>
                  <td>
                    <p className="font-medium tabular-nums">
                      {new Date(r.recorded_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.recorded_at).toLocaleDateString('id-ID')}
                    </p>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {r.is_within_geofence === false && <Badge variant="danger">Di luar area</Badge>}
                      {r.type === 'check_in' &&
                        (r.is_late ? <Badge variant="warning">Terlambat</Badge> : <Badge variant="success">Tepat waktu</Badge>)}
                      {r.type === 'check_out' && r.work_duration_minutes != null && (
                        <Badge variant="primary">{formatWorkDuration(r.work_duration_minutes)}</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    {r.geofence?.name ? (
                      r.geofence.name
                    ) : r.latitude && r.longitude ? (
                      <span className="text-xs text-muted-foreground" title={`${r.latitude}, ${r.longitude}`}>
                        Koordinat GPS
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {r.photo_url ? (
                      <button
                        onClick={() => setSelectedPhoto(r.photo_url!)}
                        className="text-sm font-medium text-primary hover:underline cursor-pointer"
                      >
                        Lihat
                      </button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </TR>
              ))}
              {records.length === 0 && <EmptyRow colSpan={6}>Tidak ada data.</EmptyRow>}
            </TBody>
          </Table>
        </TableWrapper>
      )}

      {!loading && count > PER_PAGE && (
        <Pagination page={page} totalPages={Math.ceil(count / PER_PAGE)} onChange={setPage} totalItems={count} perPage={PER_PAGE} />
      )}

      <Modal open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Foto Selfie">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {selectedPhoto && <img src={selectedPhoto} alt="Selfie" className="w-full rounded-lg" />}
      </Modal>
    </div>
  );
}
