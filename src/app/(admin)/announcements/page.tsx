'use client';

import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';
import type { Announcement } from '@/types';

interface FormData {
  title: string;
  body: string;
}

export default function AnnouncementsAdminPage() {
  const supabase = createClient();
  const toast = useToast();

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormData>({ title: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (/relation|does not exist|schema/i.test(error.message)) {
        toast.addToast(
          'warning',
          'Tabel pengumuman belum dibuat. Jalankan migration SQL terlebih dahulu.'
        );
      } else {
        console.error('Gagal memuat pengumuman:', error.message);
        toast.addToast('error', 'Gagal memuat pengumuman');
      }
      setItems([]);
    } else {
      setItems((data as Announcement[]) || []);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', body: '' });
    setFormOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.addToast('error', 'Judul dan isi pengumuman wajib diisi');
      return;
    }
    setSaving(true);

    let error;
    if (editing) {
      ({ error } = await supabase
        .from('announcements')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('announcements').insert(form));
    }

    setSaving(false);
    if (error) {
      toast.addToast('error', `Gagal menyimpan: ${error.message}`);
      return;
    }
    toast.addToast('success', editing ? 'Pengumuman diperbarui' : 'Pengumuman dibuat');
    setFormOpen(false);
    fetchItems();
  };

  const toggleActive = async (a: Announcement) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !a.is_active })
      .eq('id', a.id);
    if (error) {
      toast.addToast('error', 'Gagal mengubah status');
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !a.is_active } : x)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.addToast('error', 'Gagal menghapus pengumuman');
      return;
    }
    toast.addToast('success', 'Pengumuman dihapus');
    setDeleteTarget(null);
    fetchItems();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle
        title="Pengumuman"
        description="Kelola pengumuman yang tampil di beranda karyawan"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Buat Pengumuman
          </Button>
        }
      />

      {loading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-10 w-10 text-muted-foreground" />}
          title="Belum ada pengumuman"
          description="Buat pengumuman pertama untuk karyawan Anda."
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <Badge variant={a.is_active ? 'success' : 'outline'}>
                      {a.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground line-clamp-2">
                    {a.body}
                  </p>
                  <time className="mt-1 block text-[11px] text-muted-foreground/70">
                    {new Date(a.created_at).toLocaleString('id-ID')}
                  </time>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(a)} aria-label={a.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                    {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
      >
        <div className="space-y-4">
          <Input
            label="Judul"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Judul pengumuman"
            maxLength={120}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Isi</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Isi pengumuman…"
              rows={5}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal hapus */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Pengumuman">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus pengumuman{' '}
            <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? Tindakan ini
            tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
