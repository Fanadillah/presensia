'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geofence';
import type { Geofence } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function NearbyOffice() {
  const supabase = createClient();
  const geo = useGeolocation();
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('geofence')
        .select('*')
        .eq('is_active', true);
      if (error) setFailed(true);
      else setGeofences(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  // Tabel geofence belum ada / error → sembunyikan section secara halus
  if (failed) return null;

  const nearest = (() => {
    if (!geo.latitude || !geo.longitude || geofences.length === 0) return null;
    let best: { gf: Geofence; dist: number } | null = null;
    for (const gf of geofences) {
      const dist = calculateDistance(
        geo.latitude,
        geo.longitude,
        gf.latitude,
        gf.longitude
      );
      if (!best || dist < best.dist) best = { gf, dist };
    }
    return best;
  })();

  const inside = nearest ? nearest.dist <= nearest.gf.radius_meters : false;

  const fmtDist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MapPin className="h-4 w-4" />
        Lokasi Kantor Terdekat
      </h2>

      {!geo.latitude && !geo.loading && (
        <p className="text-sm text-muted-foreground">
          Aktifkan izin lokasi untuk melihat jarak ke kantor.
        </p>
      )}

      {(geo.loading || !nearest) && geo.latitude === null && geo.loading && (
        <p className="text-sm text-muted-foreground">Mencari posisi Anda…</p>
      )}

      {nearest && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                inside ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              }`}
            >
              <Navigation className={`h-5 w-5 ${inside ? '' : 'rotate-180'}`} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{nearest.gf.name}</p>
                <Badge variant={inside ? 'success' : 'danger'}>
                  {inside ? 'Di dalam area' : 'Di luar area'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {fmtDist(nearest.dist)} dari titik kantor · radius{' '}
                {nearest.gf.radius_meters} m
                {geo.accuracy ? ` · akurasi GPS ±${Math.round(geo.accuracy)}m` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={geo.refresh}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted cursor-pointer"
          >
            Perbarui Lokasi
          </button>
        </div>
      )}

      {geofences.length > 0 && !geo.loading && !geo.latitude && (
        <p className="text-sm text-danger">GPS tidak tersedia: {geo.error}</p>
      )}
    </section>
  );
}
