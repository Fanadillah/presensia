'use client';

import { useState } from 'react';
import { Timer, Trash2, XCircle, CheckCircle2, Clock3 } from 'lucide-react';
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
import { useOvertime } from '@/hooks/useOvertime';
import type { OvertimeRequest } from '@/types';

export function OvertimeTab() {
  const supabase = createClient();
  const toast = useToast();
  const { items, loading, error, refetch } = useOvertime();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    work_date: new Date().toISOString().split('T')[0],
    planned_hours: '1',
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OvertimeRequest | null>(null);

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      toast.addToast('error', 'Alasan lembur wajib diisi');
      return;
    }
    const hours = parseFloat(form.planned_hours);
    if (isNaN(hours) || hours <= 0 || hours > 12) {
      toast.addToast('error', 'Estimasi jam harus antara 0.5–12');
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('overtime_requests').insert({
      user_id: user.id,
      work_date: form.work_date,
      planned_hours: hours,
      reason: form.reason.trim(),
    });
    setSaving(false);

    if (err) {
      toast.addToast('error', `Gagal mengirim pengajuan: ${err.message}`);
      return;
    }
    toast.addToast('success', 'Pengajuan lembur terkirim, menunggu persetujuan');
    setFormOpen(false);
    setForm({ ...form, reason: '' });
    refetch();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    const { error: err } = await supabase
      .from('overtime_requests')
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

  const statusBadge = (s: OvertimeRequest['status']) =>
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
          <Timer className="h-4 w-4" />
          Ajukan Lembur
        </Button>
      </div>

      {error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-danger">Gagal memuat: {error}</p>
          <Button variant="secondary" className="mt-3" onClick={refetch}>
            Coba Lagi
          </Button>
        </Card>
      ) : loading ? (
        <SkeletonList rows={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-10 w-10 text-muted-foreground" />}
          title="Belum ada pengajuan lembur"
          description="Ajukan lembur jika Anda bekerja melebihi jam kerja."
        />
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <article key={o.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">
                      {o.planned_hours} jam
                    </Badge>
                    {statusBadge(o.status)}
                  </div>
                  <p className="mt-1.5 text-sm font-medium capitalize text-foreground">
                    {new Date(`${o.work_date}T00:00:00`).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{o.reason}</p>
                  {o.review_note && (
                    <p className="mt-1 rounded-lg bg-surface-muted/60 p-2 text-xs text-muted-foreground">
                      Catatan admin: {o.review_note}
                    </p>
                  )}
                </div>
                {o.status === 'pending' && (
                  <Button variant="ghost" size="icon" aria-label="Batalkan" onClick={() => setCancelTarget(o)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Ajukan Lembur">
        <div className="space-y-4">
          <Input
            label="Tanggal Lembur"
            type="date"
            value={form.work_date}
            onChange={(e) => setForm({ ...form, work_date: e.target.value })}
          />
          <Select
            label="Estimasi Durasi"
            value={form.planned_hours}
            onChange={(e) => setForm({ ...form, planned_hours: e.target.value })}
          >
            {['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '7', '8'].map((h) => (
              <option key={h} value={h}>
                {h} jam
              </option>
            ))}
          </Select>
          <Input
            label="Alasan"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Contoh: menyelesaikan laporan bulanan"
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
          <p className="text-sm text-muted-foreground">Yakin ingin membatalkan pengajuan lembur ini?</p>
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
