'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAttendance } from '@/hooks/useAttendance';
import { createClient } from '@/lib/supabase/client';
import { calculateDistance } from '@/lib/geofence';
import { CameraCapture } from '@/components/attendance/CameraCapture';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/shared/Toast';
import type { Geofence } from '@/types';

const OfficeMap = dynamic(() => import('@/components/map/OfficeMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-surface-muted">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function AbsenPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const geo = useGeolocation();
  const attendance = useAttendance();

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [geofenceLoading, setGeofenceLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'check_in' | 'check_out'>('check_in');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('geofence').select('*').eq('is_active', true);
      if (error) console.error('Gagal memuat geofence:', error.message);
      else setGeofences(data || []);
      setGeofenceLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const today = await attendance.getToday();
      if (!today) return;
      if (!today.has_check_in) setMode('check_in');
      else if (!today.has_check_out) setMode('check_out');
      else router.replace('/');
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nearest = useMemo(() => {
    if (!geo.latitude || !geo.longitude) return null;
    let best: { gf: Geofence; dist: number } | null = null;
    for (const gf of geofences) {
      const dist = calculateDistance(geo.latitude, geo.longitude, gf.latitude, gf.longitude);
      if (!best || dist < best.dist) best = { gf, dist };
    }
    return best;
  }, [geo.latitude, geo.longitude, geofences]);

  const inside = nearest ? nearest.dist <= nearest.gf.radius_meters : false;

  const handleSubmit = async (photo: Blob) => {
    if (!geo.latitude || !geo.longitude || !geo.accuracy) {
      toast.addToast('error', 'Lokasi GPS belum siap. Coba lagi.');
      return;
    }
    setSubmitting(true);
    setCameraOpen(false);

    const result =
      mode === 'check_in'
        ? await attendance.checkIn(photo, geo.latitude, geo.longitude, geo.accuracy)
        : await attendance.checkOut(photo, geo.latitude, geo.longitude, geo.accuracy);

    setSubmitting(false);
    if (result) {
      toast.addToast(
        'success',
        mode === 'check_in' ? 'Check-in berhasil!' : 'Check-out berhasil!'
      );
      router.push('/');
    } else {
      toast.addToast('error', attendance.error || 'Gagal menyimpan absensi');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {mode === 'check_in' ? 'Check In' : 'Check Out'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Pastikan lokasi Anda terdeteksi, lalu ambil foto selfie untuk konfirmasi.
        </p>
      </div>

      {/* Status kehadiran */}
      <Card
        className={`border p-4 ${
          nearest
            ? inside
              ? 'border-success/40 bg-success-soft/50'
              : 'border-danger/40 bg-danger-soft/50'
            : ''
        }`}
      >
        {nearest ? (
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                inside ? 'bg-success text-white' : 'bg-danger text-white'
              }`}
            >
              {inside ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {inside
                  ? 'Anda berada di dalam area kantor'
                  : 'Di luar jangkauan kantor'}
              </p>
              <p className="text-sm text-muted-foreground">
                {nearest.gf.name} —{' '}
                {Math.round(nearest.dist) >= 1000
                  ? `${(nearest.dist / 1000).toFixed(2)} km`
                  : `${Math.round(nearest.dist)} m`}{' '}
                dari titik kantor (radius {nearest.gf.radius_meters} m)
              </p>
            </div>
            <Badge variant={inside ? 'success' : 'danger'} className="ml-auto hidden sm:inline-flex">
              {inside ? 'Aman' : 'Tandai di luar area'}
            </Badge>
          </div>
        ) : geofenceLoading ? (
          <p className="text-sm text-muted-foreground">Memuat area kantor…</p>
        ) : (
          <p className="text-sm text-warning">
            Belum ada area kantor aktif. Absensi tetap bisa dilakukan.
          </p>        )}
      </Card>

      {/* Peta */}
      <Card className="overflow-hidden p-3">
        {geofenceLoading ? (
          <SkeletonCard />
        ) : (
          <OfficeMap geofences={geofences} userPosition={
            geo.latitude && geo.longitude
              ? { latitude: geo.latitude, longitude: geo.longitude, accuracy: geo.accuracy }
              : null
          } />
        )}
        <div className="mt-2 flex items-center justify-between px-1 pb-1">
          <span className="text-xs text-muted-foreground">
            {geo.loading
              ? 'Mencari posisi GPS…'
              : geo.latitude
                ? `Akurasi ±${Math.round(geo.accuracy ?? 0)} m`
                : `GPS error: ${geo.error}`}
          </span>
          <Button variant="ghost" size="sm" onClick={geo.refresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Perbarui
          </Button>
        </div>
      </Card>

      {/* Aksi */}
      <Button
        size="xl"
        className="w-full"
        onClick={() => setCameraOpen(true)}
        disabled={submitting}
        loading={submitting}
        variant={mode === 'check_in' ? 'primary' : 'success'}
      >
        {!submitting && <Camera className="h-5 w-5" />}
        {submitting
          ? 'Menyimpan…'
          : mode === 'check_in'
            ? 'Ambil Selfie & Check In'
            : 'Ambil Selfie & Check Out'}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Di luar radius tetap bisa absen, namun tercatat &ldquo;di luar area&rdquo;.
      </p>

      {cameraOpen && (
        <CameraCapture onCapture={handleSubmit} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}
