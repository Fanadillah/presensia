'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Pencil, Trash2, Power, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import type { Geofence } from '@/types';

const MapPicker = dynamic(() => import('@/components/map/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-surface-muted">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface GeoForm {
  name: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  address?: string;
}

const emptyForm: GeoForm = { name: '', latitude: '', longitude: '', radius_meters: '100', address: '' };

export default function GeofencePage() {
  const supabase = createClient();
  const toast = useToast();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState<GeoForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Geofence | null>(null);

  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('geofence').select('*').order('created_at', { ascending: false });
    if (error) console.error('Gagal memuat geofence:', error.message);
    else setGeofences(data || []);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  const position =
    form.latitude && form.longitude
      ? { lat: parseFloat(form.latitude), lng: parseFloat(form.longitude) }
      : null;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setStep(1);
    setFormOpen(true);
  };

  const openEdit = (g: Geofence) => {
    setEditing(g);
    setForm({
      name: g.name,
      latitude: String(g.latitude),
      longitude: String(g.longitude),
      radius_meters: String(g.radius_meters),
      address: '',
    });
    setStep(1);
    setFormOpen(true);
  };

  const handleMapChange = (pos: { lat: number; lng: number }) => {
    setForm((f) => ({
      ...f,
      latitude: pos.lat.toFixed(7),
      longitude: pos.lng.toFixed(7),
      // Geser manual/drag pin = alamat hasil pencarian tidak berlaku lagi
      address: '',
    }));
  };

  const confirmPoint = () => {
    if (!position) {
      toast.addToast('error', 'Tentukan titik lokasi terlebih dahulu');
      return;
    }
    const radius = parseInt(form.radius_meters, 10);
    if (isNaN(radius) || radius < 10 || radius > 10000) {
      toast.addToast('error', 'Radius harus antara 10–10.000 meter');
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.addToast('error', 'Nama lokasi wajib diisi');
      return;
    }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.radius_meters, 10);
    if (isNaN(lat) || isNaN(lng)) {
      toast.addToast('error', 'Koordinat belum ditentukan');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      latitude: lat,
      longitude: lng,
      radius_meters: radius,
    };
    let error;
    if (editing) {
      ({ error } = await supabase
        .from('geofence')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('geofence').insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.addToast('error', `Gagal menyimpan: ${error.message}`);
      return;
    }
    toast.addToast('success', editing ? 'Koordinat kantor diperbarui' : 'Koordinat kantor tersimpan');
    setFormOpen(false);
    fetchGeofences();
  };

  const toggleActive = async (g: Geofence) => {
    const { error } = await supabase
      .from('geofence')
      .update({ is_active: !g.is_active })
      .eq('id', g.id);
    if (error) {
      toast.addToast('error', 'Gagal mengubah status');
      return;
    }
    setGeofences((prev) => prev.map((x) => (x.id === g.id ? { ...x, is_active: !g.is_active } : x)));
    toast.addToast('success', `${g.name} ${g.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const { error } = await supabase.from('geofence').delete().eq('id', deleteTarget.id);
    setSaving(false);
    if (error) {
      toast.addToast('error', 'Gagal menghapus geofence. Kemungkinan sedang dipakai data absensi.');
      return;
    }
    toast.addToast('success', 'Geofence dihapus');
    setDeleteTarget(null);
    fetchGeofences();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle
        title="Geofence"
        description="Area absensi berbasis lokasi"
        action={
          isOwner ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Tambah Lokasi
            </Button>
          ) : undefined
        }
      />

      {!isOwner && !loading && geofences.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-muted/60 p-3 text-xs text-muted-foreground">
          Mode lihat saja — hanya owner yang dapat mengelola titik kantor.
        </div>
      )}

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : geofences.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10 text-muted-foreground" />}
          title="Belum ada area absensi"
          description="Tambahkan titik kantor agar karyawan bisa absen berbasis GPS."
        />
      ) : (
        <div className="space-y-3">
          {geofences.map((g) => (
            <article key={g.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{g.name}</h3>
                      <Badge variant={g.is_active ? 'success' : 'outline'}>
                        {g.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Radius {g.radius_meters} m ·{' '}
                      {g.latitude.toFixed(5)}, {g.longitude.toFixed(5)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-0.5">
                  {isOwner ? (
                    <>
                      <Button variant="ghost" size="icon" aria-label={g.is_active ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => toggleActive(g)}>
                        <Power className={`h-4 w-4 ${g.is_active ? '' : 'text-success'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(g)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Hapus" onClick={() => setDeleteTarget(g)}>
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal form 2 langkah */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        wide
        title={
          editing
            ? `Edit — ${editing.name}`
            : step === 1
              ? 'Tambah Lokasi Kantor'
              : 'Konfirmasi Koordinat'
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Cari nama tempat, klik peta, atau geser pin untuk menentukan titik kantor. Atur
              radius lingkaran absensi.
            </p>

            <MapPicker
              position={position}
              radiusMeters={parseInt(form.radius_meters, 10) || 0}
              onChange={handleMapChange}
              onAddressFound={(addr) => setForm((f) => ({ ...f, address: addr }))}
            />

            <div className="grid grid-cols-3 gap-3">
              <Input label="Latitude" value={form.latitude} readOnly placeholder="Klik peta…" />
              <Input label="Longitude" value={form.longitude} readOnly placeholder="Klik peta…" />
              <Input
                label="Radius (m)"
                type="number"
                min={10}
                max={10000}
                value={form.radius_meters}
                onChange={(e) => setForm({ ...form, radius_meters: e.target.value })}
              />
            </div>

            <Button size="lg" className="w-full" onClick={confirmPoint} disabled={!position}>
              <MapPin className="h-5 w-5" />
              Tentukan Koordinat Kantor
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ringkasan */}
            <div className="rounded-xl border border-success/30 bg-success-soft/50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 className="h-5 w-5" />
                Koordinat kantor dipilih
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Latitude</dt>
                  <dd className="font-medium tabular-nums">{form.latitude}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Longitude</dt>
                  <dd className="font-medium tabular-nums">{form.longitude}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Radius absensi</dt>
                  <dd className="font-medium">{form.radius_meters} meter</dd>
                </div>
                {form.address && (
                  <div className="pt-1">
                    <dt className="text-muted-foreground">Alamat perkiraan</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-foreground/90">
                      {form.address}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <Input
              label="Nama Lokasi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Kantor Pusat"
              hint="Nama ini yang akan dilihat karyawan saat absen."
            />

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Ubah Titik
              </Button>
              <Button className="flex-1" onClick={handleSave} loading={saving}>
                Simpan Lokasi Kantor
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal hapus */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Geofence">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus area <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={saving}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
