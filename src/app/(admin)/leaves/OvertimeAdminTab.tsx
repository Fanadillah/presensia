'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock3, Timer } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useOvertime } from '@/hooks/useOvertime';
import type { OvertimeRequest } from '@/types';

const statusFilterOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

export function OvertimeAdminTab() {
  const supabase = createClient();
  const toast = useToast();
  const { user } = useAuth();
  const { items, loading, error, refetch } = useOvertime();

  const [filter, setFilter] = useState('pending');
  const [reviewTarget, setReviewTarget] = useState<OvertimeRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = filter === 'all' ? items : items.filter((o) => o.status === filter);

  const canReview = (o: OvertimeRequest) => {
    if (!user) return false;
    if (o.user_id === user.id) return false;
    if (user.role === 'owner') return true;
    const targetRole = o.user?.role ?? 'karyawan';
    return user.role === 'admin' && targetRole === 'karyawan';
  };

  const openReview = (o: OvertimeRequest, d: 'approved' | 'rejected') => {
    setReviewTarget(o);
    setDecision(d);
    setNote('');
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setSaving(true);
    const {
      data: { user: me },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('overtime_requests')
      .update({ status: decision, review_note: note.trim() || null, reviewed_by: me?.id ?? null })
      .eq('id', reviewTarget.id);
    setSaving(false);
    if (error) {
      toast.addToast('error', 'Gagal memproses pengajuan');
      return;
    }
    toast.addToast('success', `Pengajuan ${decision === 'approved' ? 'disetujui' : 'ditolak'}`);
    setReviewTarget(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select label="Filter Status" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {statusFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-danger">Gagal memuat: {error}</p>
          <Button variant="secondary" className="mt-3" onClick={refetch}>
            Coba Lagi
          </Button>
        </Card>
      ) : loading ? (
        <SkeletonList rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Timer className="h-10 w-10 text-muted-foreground" />}
          title="Tidak ada pengajuan lembur"
          description="Tidak ada pengajuan dengan status ini."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <article key={o.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar name={o.user?.full_name ?? '?'} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold capitalize text-foreground">{o.user?.full_name}</p>
                    <Badge variant="primary">{o.planned_hours} jam</Badge>
                    {o.status === 'approved' && (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Disetujui</Badge>
                    )}
                    {o.status === 'rejected' && (
                      <Badge variant="danger"><XCircle className="h-3 w-3" /> Ditolak</Badge>
                    )}
                    {o.status === 'pending' && (
                      <Badge variant="warning"><Clock3 className="h-3 w-3" /> Menunggu</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {new Date(`${o.work_date}T00:00:00`).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/90">{o.reason}</p>
                  {o.review_note && (
                    <p className="mt-1 rounded-lg bg-surface-muted/60 p-2 text-xs text-muted-foreground">
                      Catatan: {o.review_note}
                    </p>
                  )}

                  {o.status === 'pending' &&
                    (canReview(o) ? (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="success" onClick={() => openReview(o, 'approved')}>
                          <CheckCircle2 className="h-4 w-4" /> Setujui
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openReview(o, 'rejected')}>
                          <XCircle className="h-4 w-4" /> Tolak
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-lg bg-warning-soft p-2 text-xs text-warning">
                        Pengajuan ini hanya dapat diproses oleh owner.
                      </p>
                    ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={decision === 'approved' ? 'Setujui Lembur' : 'Tolak Lembur'}
      >
        <div className="space-y-4">
          <Input label="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Batal
            </Button>
            <Button variant={decision === 'approved' ? 'primary' : 'danger'} onClick={handleReview} loading={saving}>
              {decision === 'approved' ? 'Setujui' : 'Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
