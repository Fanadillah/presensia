'use client';

import { useState } from 'react';
import { PlaneTakeoff, Trash2, XCircle, CheckCircle2, Clock3, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('leave_requests').insert({
      user_id: user.id,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason.trim(),
    });
    setSaving(false);

    if (err && /relation|does not exist|schema/i.test(err.message)) {
      toast.addToast('warning', 'Fitur belum aktif. Jalankan migration SQL terlebih dahulu.');
      return;
    }
    if (err) {
      toast.addToast('error', `Gagal mengirim pengajuan: ${err.message}`);
      return;
    }
    toast.addToast('success', 'Pengajuan terkirim, menunggu persetujuan admin');
    setFormOpen(false);
    setForm({ ...form, reason: '' });
    refetch();
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
