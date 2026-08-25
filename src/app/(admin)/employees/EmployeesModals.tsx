'use client';

import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCropper } from '@/components/shared/AvatarCropper';
import type { User } from '@/types';

export interface EmployeeForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  photo?: File | null;
  photoPreview?: string | null;
}

interface Props {
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  addForm: EmployeeForm;
  setAddForm: (f: EmployeeForm) => void;
  onAdd: () => void;
  saving: boolean;
  isOwner?: boolean;
}

function RoleOptions({ isOwner }: { isOwner?: boolean }) {
  return (
    <>
      <option value="karyawan">Karyawan</option>
      {isOwner && <option value="admin">Admin</option>}
      {isOwner && <option value="owner">Owner</option>}
    </>
  );
}

export function AddEmployeeModal({ addOpen, setAddOpen, addForm, setAddForm, onAdd, saving, isOwner }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setRawFile(f);
    setCropSrc(URL.createObjectURL(f));
    e.target.value = '';
  };
  const handleCrop = (blob: Blob) => {
    const file = new File([blob], rawFile?.name || 'avatar.jpg', { type: 'image/jpeg' });
    const preview = URL.createObjectURL(blob);
    if (addForm.photoPreview) URL.revokeObjectURL(addForm.photoPreview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setAddForm({ ...addForm, photo: file, photoPreview: preview });
    setCropSrc(null);
    setRawFile(null);
  };
  return (
    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Karyawan">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={addForm.full_name || 'Karyawan'} src={addForm.photoPreview ?? null} size="lg" />
          <div className="flex-1">
            <p className="text-sm font-medium">Foto Profil (opsional)</p>
            <p className="text-xs text-muted-foreground">Admin set foto saat daftar — hemat storage 400×400 q70</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> {addForm.photo ? 'Ganti Foto' : 'Pilih Foto'}
            </Button>
            {addForm.photo && <p className="mt-1 text-xs text-muted-foreground">{addForm.photo.name} — {(addForm.photo.size / 1024).toFixed(0)}KB (drag & zoom sudah pas)</p>}
          </div>
        </div>
        <AvatarCropper open={!!cropSrc} src={cropSrc} onClose={() => { if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null); }} onCrop={handleCrop} />
        <Input
          label="Nama Lengkap"
          value={addForm.full_name}
          onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
          placeholder="Nama karyawan"
        />
        <Input
          label="Email"
          type="email"
          value={addForm.email}
          onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          placeholder="email@contoh.com"
        />
        <Input
          label="Password Awal"
          value={addForm.password}
          onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
          placeholder="Minimal 6 karakter"
          hint="Bagikan password ini ke karyawan."
        />
        <Input
          label="Telepon"
          value={addForm.phone}
          onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
          placeholder="08xx (opsional)"
        />
        <Select
          label="Role"
          value={addForm.role}
          onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
        >
          <RoleOptions isOwner={isOwner} />
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setAddOpen(false)}>
            Batal
          </Button>
          <Button onClick={onAdd} loading={saving}>
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface EditProps {
  target: User | null;
  onClose: () => void;
  form: { full_name: string; phone: string; role: string; photo?: File | null; photoPreview?: string | null };
  setForm: (f: { full_name: string; phone: string; role: string; photo?: File | null; photoPreview?: string | null }) => void;
  onSave: () => void;
  saving: boolean;
  isOwner?: boolean;
}

export function EditEmployeeModal({ target, onClose, form, setForm, onSave, saving, isOwner }: EditProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    setRawFile(f);
    setCropSrc(URL.createObjectURL(f));
    e.target.value = '';
  };
  const handleCrop = (blob: Blob) => {
    const file = new File([blob], rawFile?.name || 'avatar.jpg', { type: 'image/jpeg' });
    const preview = URL.createObjectURL(blob);
    if (form.photoPreview) URL.revokeObjectURL(form.photoPreview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setForm({ ...form, photo: file, photoPreview: preview });
    setCropSrc(null);
    setRawFile(null);
  };
  return (
    <Modal open={!!target} onClose={onClose} title={`Edit — ${target?.full_name ?? ''}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={target?.full_name ?? ''} src={form.photoPreview ?? target?.photo_url ?? null} size="lg" />
          <div className="flex-1">
            <p className="text-sm font-medium">Foto Profil</p>
            <p className="text-xs text-muted-foreground">Admin bisa ganti foto kapanpun</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> {form.photo ? 'Foto baru dipilih (sudah crop)' : 'Ganti Foto'}
            </Button>
          </div>
        </div>
        <AvatarCropper open={!!cropSrc} src={cropSrc} onClose={() => { if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null); }} onCrop={handleCrop} />
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
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <RoleOptions isOwner={isOwner} />
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSave} loading={saving}>
            Simpan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ResetProps {
  target: User | null;
  onClose: () => void;
  password: string;
  setPassword: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function ResetPasswordModal({ target, onClose, password, setPassword, onSave, saving }: ResetProps) {
  return (
    <Modal open={!!target} onClose={onClose} title={`Reset Password — ${target?.full_name ?? ''}`}>
      <div className="space-y-4">
        <Input
          label="Password Baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          hint="Karyawan akan login dengan password baru ini."
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" onClick={onSave} loading={saving}>
            Reset Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface ToggleProps {
  target: User | null;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export function ToggleActiveModal({ target, onClose, onSave, saving }: ToggleProps) {
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target?.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {target?.is_active
            ? `${target?.full_name} tidak akan bisa login sampai akunnya diaktifkan kembali.`
            : `Aktifkan kembali akses login untuk ${target?.full_name}?`}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant={target?.is_active ? 'danger' : 'primary'}
            onClick={onSave}
            loading={saving}
          >
            Ya, Lanjutkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
