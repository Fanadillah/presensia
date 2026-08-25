'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, KeyRound, CalendarDays, Clock3, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageTitle } from '@/components/shared/PageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/shared/Modal';
import { AvatarCropper } from '@/components/shared/AvatarCropper';
import { useToast } from '@/components/shared/Toast';
import { useMonthlyPresence } from '@/hooks/useMonthlyPresence';

export default function ProfilePage() {
  const supabase = createClient();
  const toast = useToast();
  const { user, logout } = useAuth();

  const now = new Date();
  const presence = useMonthlyPresence(now.getFullYear(), now.getMonth() + 1);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [passwords, setPasswords] = useState({ baru: '', konfirmasi: '' });
  const [savingPw, setSavingPw] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name, phone: user.phone ?? '' });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.addToast('error', 'Nama tidak boleh kosong');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('users')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast.addToast('error', 'Gagal menyimpan profil');
      return;
    }
    toast.addToast('success', 'Profil diperbarui');
    setEditOpen(false);
    window.location.reload();
  };

  const handleChangePassword = async () => {
    if (passwords.baru.length < 6) {
      toast.addToast('error', 'Password minimal 6 karakter');
      return;
    }
    if (passwords.baru !== passwords.konfirmasi) {
      toast.addToast('error', 'Konfirmasi password tidak cocok');
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.baru });
    setSavingPw(false);
    if (error) {
      toast.addToast('error', `Gagal ganti password: ${error.message}`);
      return;
    }
    toast.addToast('success', 'Password berhasil diganti');
    setPwOpen(false);
    setPasswords({ baru: '', konfirmasi: '' });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setCropSrc(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleCropDone = (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setSavingPhoto(true);
    const fd = new FormData();
    fd.append('photo', photoFile);
    const res = await fetch('/api/profile/photo', { method: 'POST', body: fd });
    const json = await res.json();
    setSavingPhoto(false);
    if (!json.success) {
      toast.addToast('error', json.error || 'Gagal upload foto');
      return;
    }
    toast.addToast('success', 'Foto profil diperbarui');
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    window.location.reload();
  };

  const stats = presence.summary;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageTitle title="Profil" />

      {user && (
        <>
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar name={user.full_name} src={photoPreview ?? user.photo_url} size="xl" />
                <button
                  onClick={() => photoRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-hover"
                  title="Ganti foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              <AvatarCropper open={!!cropSrc} src={cropSrc} onClose={() => { if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null); }} onCrop={handleCropDone} />
              {photoFile && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoFile(null); setPhotoPreview(null); }}>
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleUploadPhoto} loading={savingPhoto}>
                    Simpan Foto (sudah crop)
                  </Button>
                </div>
              )}
              {!photoFile && <p className="mt-2 text-xs text-muted-foreground">Ketuk kamera → drag & zoom biar wajah pas di lingkaran</p>}
              <h2 className="mt-4 text-xl font-bold text-foreground">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="primary" className="mt-2 capitalize">
                {user.role}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-muted/60 p-3 text-center">
                <CalendarDays className="mx-auto h-5 w-5 text-success" />
                <p className="mt-1 text-lg font-bold text-foreground">{stats.presentDays} hari</p>
                <p className="text-xs text-muted-foreground">Hadir bulan ini</p>
              </div>
              <div className="rounded-xl bg-surface-muted/60 p-3 text-center">
                <Clock3 className="mx-auto h-5 w-5 text-warning" />
                <p className="mt-1 text-lg font-bold text-foreground">{stats.lateDays} kali</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between rounded-xl bg-surface-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">Telepon</span>
                <span className="font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-surface-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="flex justify-between rounded-xl bg-surface-muted/60 p-3 text-sm">
                <span className="text-muted-foreground">Bergabung</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit Profil
              </Button>
              <Button variant="secondary" onClick={() => setPwOpen(true)}>
                <KeyRound className="h-4 w-4" />
                Ganti Password
              </Button>
            </div>

            <Button variant="danger" className="mt-2 w-full" onClick={logout}>
              Keluar
            </Button>
          </Card>

          {/* Modal edit profil */}
          <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profil">
            <div className="space-y-4">
              <Input
                label="Nama Lengkap"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              <Input
                label="Telepon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveProfile} loading={savingProfile}>
                  Simpan
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal ganti password */}
          <Modal open={pwOpen} onClose={() => setPwOpen(false)} title="Ganti Password">
            <div className="space-y-4">
              <Input
                label="Password Baru"
                type="password"
                value={passwords.baru}
                onChange={(e) => setPasswords({ ...passwords, baru: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={passwords.konfirmasi}
                onChange={(e) => setPasswords({ ...passwords, konfirmasi: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setPwOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleChangePassword} loading={savingPw}>
                  Ganti Password
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
