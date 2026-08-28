'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Download, Search, Printer, MapPin, CalendarDays, Users, Layers, ExternalLink } from 'lucide-react';
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

const AttendanceMiniMap = dynamic(() => import('@/components/map/AttendanceMiniMap'), { ssr: false });

const PER_PAGE = 15;

type TypeFilter = 'all' | 'check_in' | 'check_out';
type StatusFilter = 'all' | 'in_area' | 'out_area' | 'late' | 'on_time';
type QuickFilter = 'today' | 'all' | 'custom';

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
  const [mapRecord, setMapRecord] = useState<(Attendance & { user?: User; geofence?: Geofence }) | null>(null);

  // Filter
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('today');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [employees, setEmployees] = useState<Pick<User, 'id' | 'full_name' | 'role'>[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [startDate, endDate, debouncedSearch, typeFilter, statusFilter, employeeFilter, quickFilter]);

  // Keep quickFilter in sync when user manually edits dates
  const handleStartChange = (v: string) => {
    setStartDate(v);
    setQuickFilter('custom');
  };
  const handleEndChange = (v: string) => {
    setEndDate(v);
    setQuickFilter('custom');
  };
  const handleToday = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
    setQuickFilter('today');
  };
  const handleAll = () => {
    setStartDate(monthAgoStr);
    setEndDate(todayStr);
    setQuickFilter('all');
  };

  // Fetch employees for filter dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase.from('users').select('id, full_name, role').eq('is_active', true).order('full_name');
      if (data) setEmployees(data as any);
    };
    fetchEmployees();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('attendance')
      .select('*, user:users(*), geofence:geofence_id(id, name, latitude, longitude, radius_meters)', { count: 'exact' })
      .order('recorded_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    // Filter tanggal: jika quickFilter today/custom pakai range, jika all pakai monthAgoStr..today (atau tanpa filter kalau ingin semua data)
    // Sesuai request: default hari ini, klik All baru keliatan semuanya (di sini All = 30 hari terakhir)
    if (quickFilter === 'today') {
      query = query.gte('recorded_at', `${todayStr}T00:00:00`).lte('recorded_at', `${todayStr}T23:59:59`);
    } else if (quickFilter === 'custom') {
      if (startDate) query = query.gte('recorded_at', `${startDate}T00:00:00`);
      if (endDate) query = query.lte('recorded_at', `${endDate}T23:59:59`);
    } else {
      // all = 30 hari terakhir
      query = query.gte('recorded_at', `${monthAgoStr}T00:00:00`).lte('recorded_at', `${todayStr}T23:59:59`);
    }

    if (employeeFilter !== 'all') {
      query = query.eq('user_id', employeeFilter);
    }
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data, error, count: total } = await query;
    if (error) console.error('Gagal memuat absensi:', error.message);

    let rows: any[] = (data as any) || [];

    // Client-side search by name (lebih reliable daripada ilike join)
    if (debouncedSearch) {
      rows = rows.filter((r) => r.user?.full_name?.toLowerCase().includes(debouncedSearch));
    }

    if (statusFilter === 'in_area') rows = rows.filter((r: any) => r.is_within_geofence === true);
    else if (statusFilter === 'out_area') rows = rows.filter((r: any) => r.is_within_geofence === false);
    else if (statusFilter === 'late') rows = rows.filter((r: any) => r.type === 'check_in' && r.is_late === true);
    else if (statusFilter === 'on_time') rows = rows.filter((r: any) => r.type === 'check_in' && r.is_late === false);

    setRecords(rows);
    setCount(total ?? 0);
    setLoading(false);
  }, [supabase, startDate, endDate, page, debouncedSearch, typeFilter, statusFilter, employeeFilter, quickFilter, todayStr, monthAgoStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = () => {
    const header = ['Tanggal', 'Nama', 'Tipe', 'Waktu', 'Status Lokasi', 'Terlambat', 'Durasi (menit)', 'Geofence', 'Latitude', 'Longitude', 'Link Maps'];
    const lines = records.map((r) => [
      new Date(r.recorded_at).toLocaleDateString('id-ID'),
      r.user?.full_name ?? '-',
      r.type === 'check_in' ? 'Check In' : 'Check Out',
      new Date(r.recorded_at).toLocaleTimeString('id-ID'),
      r.is_within_geofence ? 'Dalam area' : 'Di luar area',
      r.type === 'check_in' ? (r.is_late ? 'Ya' : 'Tidak') : '',
      r.work_duration_minutes?.toString() ?? '',
      r.geofence?.name ?? '',
      r.latitude?.toString() ?? '',
      r.longitude?.toString() ?? '',
      r.latitude && r.longitude ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : '',
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

  const gmapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
  const gmapsDirectionsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

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

      {/* Quick filter Hari Ini / All */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Tampilkan:</span>
        <Button
          size="sm"
          variant={quickFilter === 'today' ? 'primary' : 'secondary'}
          onClick={handleToday}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Hari Ini
        </Button>
        <Button
          size="sm"
          variant={quickFilter === 'all' ? 'primary' : 'secondary'}
          onClick={handleAll}
        >
          <Layers className="h-3.5 w-3.5" /> Semua (30 hari)
        </Button>
        {quickFilter === 'custom' && (
          <Badge variant="warning">Custom: {startDate} s/d {endDate}</Badge>
        )}
        {quickFilter === 'today' && (
          <span className="text-xs text-muted-foreground">Default menampilkan data hari ini ({todayStr})</span>
        )}
      </div>

      {/* Filter */}
      <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:grid-cols-3 lg:grid-cols-6">
        <Input
          label="Dari Tanggal"
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => handleStartChange(e.target.value)}
        />
        <Input
          label="Sampai Tanggal"
          type="date"
          value={endDate}
          min={startDate}
          max={todayStr}
          onChange={(e) => handleEndChange(e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Karyawan</label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-9 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 cursor-pointer"
            >
              <option value="all">Semua karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>
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
          description={
            quickFilter === 'today'
              ? `Tidak ada absensi hari ini (${todayStr}). Klik "Semua" untuk melihat 30 hari terakhir.`
              : `Tidak ada absensi yang cocok dengan filter (${startDate} s/d ${endDate}).`
          }
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
                <th>Aksi</th>
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
                      {r.is_within_geofence === true && <Badge variant="success">Dalam area</Badge>}
                      {r.type === 'check_in' &&
                        (r.is_late ? <Badge variant="warning">Terlambat</Badge> : <Badge variant="success">Tepat waktu</Badge>)}
                      {r.type === 'check_out' && r.work_duration_minutes != null && (
                        <Badge variant="primary">{formatWorkDuration(r.work_duration_minutes)}</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    {r.geofence?.name ? (
                      <span className="text-xs">{r.geofence.name}</span>
                    ) : r.latitude && r.longitude ? (
                      <span className="text-xs text-muted-foreground" title={`${r.latitude}, ${r.longitude}`}>
                        {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
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
                  <td>
                    {r.latitude && r.longitude ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMapRecord(r)}
                        title="Lihat posisi di peta"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Maps
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </TR>
              ))}
              {records.length === 0 && <EmptyRow colSpan={7}>Tidak ada data.</EmptyRow>}
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

      {/* Mini Maps Modal */}
      <Modal
        open={!!mapRecord}
        onClose={() => setMapRecord(null)}
        title={mapRecord ? `Lokasi Absen — ${mapRecord.user?.full_name ?? ''}` : 'Lokasi Absen'}
        wide
      >
        {mapRecord && mapRecord.latitude && mapRecord.longitude && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{mapRecord.type === 'check_in' ? 'Check In' : 'Check Out'}</span>
              <span>•</span>
              <span>{new Date(mapRecord.recorded_at).toLocaleString('id-ID')}</span>
              {mapRecord.is_within_geofence === false ? (
                <Badge variant="danger">Di luar area</Badge>
              ) : mapRecord.is_within_geofence === true ? (
                <Badge variant="success">Dalam area</Badge>
              ) : null}
            </div>

            <AttendanceMiniMap
              latitude={mapRecord.latitude}
              longitude={mapRecord.longitude}
              accuracy={mapRecord.accuracy}
              isWithinGeofence={mapRecord.is_within_geofence}
              geofence={
                mapRecord.geofence as unknown as Geofence | null
              }
              employeeName={mapRecord.user?.full_name ?? undefined}
              recordedAt={mapRecord.recorded_at}
              height="340px"
            />

            <div className="rounded-xl border border-border bg-surface-muted p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground">Detail Koordinat</p>
              <p className="text-xs font-mono text-muted-foreground">
                {mapRecord.latitude.toFixed(6)}, {mapRecord.longitude.toFixed(6)}
                {mapRecord.accuracy != null && `  (±${Math.round(mapRecord.accuracy)} m)`}
              </p>
              {mapRecord.geofence && (
                <p className="text-xs text-muted-foreground">
                  Geofence: <span className="font-medium text-foreground">{mapRecord.geofence.name}</span>
                  {' '}— radius {mapRecord.geofence.radius_meters} m
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <a
                  href={gmapsUrl(mapRecord.latitude, mapRecord.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Buka di Google Maps
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href={gmapsDirectionsUrl(mapRecord.latitude, mapRecord.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Petunjuk Arah
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
