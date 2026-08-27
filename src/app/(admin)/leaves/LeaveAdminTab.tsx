'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock3 } from 'lucide-react';
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
import { useLeaves } from '@/hooks/useLeaves';
import type { LeaveRequest } from '@/types';

const statusFilterOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
];

export function LeaveAdminTab() {
  const supabase = createClient();
  const toast = useToast();
  const { user } = useAuth();
  const { leaves, loading, error, refetch } = useLeaves();

  const [filter, setFilter] = useState('pending');
  const [reviewTarget, setReviewTarget] = useState<LeaveRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  const canReview = (l: LeaveRequest) => {
    if (!user) return false;
    if (l.user_id === user.id) return false;
    if (user.role === 'owner') return true;
    const targetRole = l.user?.role ?? 'karyawan';
    return user.role === 'admin' && targetRole === 'karyawan';
  };

  const openReview = (l: LeaveRequest, d: 'approved' | 'rejected') => {
    setReviewTarget(l);
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
      .from('leave_requests')
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

      {error === 'MIGRATION_MISSING' ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Fitur belum aktif. Jalankan migration SQL terlebih dahulu.
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
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada pengajuan" description="Tidak ada pengajuan dengan status ini." />
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <article key={l.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar name={l.user?.full_name ?? '?'} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold capitalize text-foreground">{l.user?.full_name}</p>
                    <Badge variant="primary">{l.type === 'cuti' ? 'Cuti' : l.type === 'izin' ? 'Izin' : 'Sakit'}</Badge>
                    {l.status === 'approved' && (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Disetujui</Badge>
                    )}
                    {l.status === 'rejected' && (
                      <Badge variant="danger"><XCircle className="h-3 w-3" /> Ditolak</Badge>
                    )}
                    {l.status === 'pending' && (
                      <Badge variant="warning"><Clock3 className="h-3 w-3" /> Menunggu</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(`${l.start_date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {l.start_date !== l.end_date &&
                      ` – ${new Date(`${l.end_date}T00:00:00`).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/90">{l.reason}</p>
                  {(l as any).attachment_url && (
                    <a href={(l as any).attachment_url} target="_blank" rel="noopener" className="mt-2 inline-block">
                      <img src={(l as any).attachment_url} alt="surat sakit" className="max-h-40 rounded-xl border object-contain" />
                    </a>
                  )}
                  {l.type==='sakit' && !(l as any).attachment_url && <p className="mt-1 text-xs text-muted-foreground">Tanpa surat</p>}
                  {l.review_note && (
                    <p className="mt-1 rounded-lg bg-surface-muted/60 p-2 text-xs text-muted-foreground">
                      Catatan: {l.review_note}
                    </p>
                  )}

                  {l.status === 'pending' &&
                    (canReview(l) ? (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="success" onClick={() => openReview(l, 'approved')}>
                          <CheckCircle2 className="h-4 w-4" /> Setujui
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openReview(l, 'rejected')}>
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
        title={decision === 'approved' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
      >
        <div className="space-y-4">
          <Input
            label="Catatan (opsional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
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
