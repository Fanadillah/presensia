'use client';

import { useState, useRef } from 'react';
import { PlaneTakeoff, Trash2, XCircle, CheckCircle2, Clock3, FileText, Camera, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CameraCapture } from '@/components/attendance/CameraCapture';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useLeaves } from '@/hooks/useLeaves';
import type { LeaveRequest } from '@/types';

const typeLabels = { cuti: 'Cuti', izin: 'Izin', sakit: 'Sakit' } as const;

export function LeaveTab() {
  const supabase = createClient();
  const toast = useToast();
  const { leaves, loading, error, refetch } = useLeaves();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'cuti',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) { setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null); return; }
    if (f.size > 5 * 1024 * 1024) { toast.addToast('error', 'File max 5MB'); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(f.type)) { toast.addToast('error', 'Hanya JPG/PNG/WEBP'); return; }
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  };

  const handleCamera = (blob: Blob) => {
    const f = new File([blob], 'surat-sakit.jpg', { type: 'image/jpeg' });
    handleFile(f);
    setCameraOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      toast.addToast('error', 'Alasan wajib diisi');
      return;
    }
    if (form.end_date < form.start_date) {
      toast.addToast('error', 'Tanggal selesai tidak boleh sebelum tanggal mulai');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('start_date', form.start_date);
      fd.append('end_date', form.end_date);
      fd.append('reason', form.reason.trim());
      if (form.type === 'sakit' && file) fd.append('file', file);
      const res = await fetch('/api/leaves', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal');
      toast.addToast('success', 'Pengajuan terkirim, menunggu persetujuan admin');
      setFormOpen(false);
      setForm({ ...form, reason: '' });
      setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null);
      refetch();
    } catch (e: any) {
      if (/relation|does not exist|schema/i.test(e.message)) toast.addToast('warning', 'Fitur belum aktif. Jalankan migration SQL terlebih dahulu.');
      else toast.addToast('error', `Gagal: ${e.message}`);
    } finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    const { error: err } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', cancelTarget.id)
      .eq('status', 'pending');
    setSaving(false);
    if (err) {
      toast.addToast('error', 'Gagal membatalkan pengajuan');
      return;
    }
    toast.addToast('success', 'Pengajuan dibatalkan');
    setCancelTarget(null);
    refetch();
  };

  const statusBadge = (s: LeaveRequest['status']) =>
    s === 'approved' ? (
      <Badge variant="success">
        <CheckCircle2 className="h-3 w-3" /> Disetujui
      </Badge>
    ) : s === 'rejected' ? (
      <Badge variant="danger">
        <XCircle className="h-3 w-3" /> Ditolak
      </Badge>
    ) : (
      <Badge variant="warning">
        <Clock3 className="h-3 w-3" /> Menunggu
      </Badge>
    );

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <PlaneTakeoff className="h-4 w-4" />
          Ajukan Cuti/Izin
        </Button>
      </div>

      {error === 'MIGRATION_MISSING' ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Fitur ini belum aktif karena tabel database belum dibuat.
        </Card>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-danger">Gagal memuat: {error}</p>
          <Button variant="secondary" className="mt-3" onClick={refetch}>
            Coba Lagi
          </Button>
        </Card>
      ) : loading ? (
        <SkeletonList rows={4} />
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="Belum ada pengajuan"
          description="Klik tombol Ajukan untuk membuat pengajuan pertama."
        />
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <article key={l.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{typeLabels[l.type]}</Badge>
                    {statusBadge(l.status)}
                  </div>
                  <p className="mt-1.5 text-sm font-medium capitalize text-foreground">
                    {new Date(`${l.start_date}T00:00:00`).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {l.start_date !== l.end_date &&
                      ` – ${new Date(`${l.end_date}T00:00:00`).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}`}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{l.reason}</p>
                  {(l as any).attachment_url && <a href={(l as any).attachment_url} target="_blank" rel="noopener" className="mt-2 block"><img src={(l as any).attachment_url} alt="surat sakit" className="max-h-32 rounded-xl border object-contain" /></a>}
                  {l.type==='sakit' && !(l as any).attachment_url && <p className="mt-1 text-xs text-muted-foreground">Tanpa surat</p>}
                  {l.review_note && (
                    <p className="mt-1 rounded-lg bg-surface-muted/60 p-2 text-xs text-muted-foreground">
                      Catatan admin: {l.review_note}
                    </p>
                  )}
                </div>
                {l.status === 'pending' && (
                  <Button variant="ghost" size="icon" aria-label="Batalkan" onClick={() => setCancelTarget(l)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {cameraOpen && <CameraCapture onCapture={handleCamera} onClose={() => setCameraOpen(false)} />}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Ajukan Cuti / Izin">
        <div className="space-y-4">
          <Select label="Jenis" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="cuti">Cuti</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mulai" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="Selesai" type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Input
            label="Alasan"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Contoh: acara keluarga"
          />
          {form.type === 'sakit' && (
            <div className="rounded-xl border border-dashed border-border bg-surface-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Foto surat sakit (opsional, auto-hapus 3 hari) — Kamera atau Galeri</p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCameraOpen(true)}><Camera className="h-4 w-4" /> Kamera</Button>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Galeri</Button>
                {file && <Button variant="ghost" size="sm" onClick={() => handleFile(null)}><X className="h-4 w-4" /> Hapus</Button>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
              {preview && <img src={preview} alt="preview" className="mt-3 max-h-48 rounded-xl border object-contain" />}
              {file && <p className="mt-1 text-xs text-muted-foreground">{file.name} • {(file.size/1024).toFixed(0)} KB</p>}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Batalkan Pengajuan">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Yakin ingin membatalkan pengajuan ini?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Kembali
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={saving}>
              Ya, Batalkan
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
