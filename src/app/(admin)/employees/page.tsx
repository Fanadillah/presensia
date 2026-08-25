'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Pencil, KeyRound, Power } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageTitle } from '@/components/shared/PageTitle';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/shared/Toast';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableWrapper, Table, THead, TBody, TR, EmptyRow } from '@/components/ui/Table';
import {
  AddEmployeeModal,
  EditEmployeeModal,
  ResetPasswordModal,
  ToggleActiveModal,
} from './EmployeesModals';
import type { User } from '@/types';

const PER_PAGE = 12;

export default function EmployeesPage() {
  const supabase = createClient();
  const toast = useToast();
  const { user } = useAuth();
  const myRole = user?.role === 'owner' ? 'owner' : 'admin';
  // Hierarki: admin hanya bisa mengelola akun karyawan
  const canManage = (targetRole: string) =>
    myRole === 'owner' ? true : targetRole === 'karyawan';

  const [employees, setEmployees] = useState<User[]>([]);
  const [lastCheckIns, setLastCheckIns] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<{ full_name: string; email: string; password: string; phone: string; role: string; photo?: File | null; photoPreview?: string | null }>({ full_name: '', email: '', password: '', phone: '', role: 'karyawan', photo: null, photoPreview: null });
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; phone: string; role: string; photo?: File | null; photoPreview?: string | null }>({ full_name: '', phone: '', role: 'karyawan', photo: null, photoPreview: null });
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debouncedSearch, roleFilter]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Gagal memuat karyawan:', error.message);
      toast.addToast('error', 'Gagal memuat data karyawan');
      setLoading(false);
      return;
    }
    const list = (users as User[]) || [];
    setEmployees(list);

    if (list.length > 0) {
      const { data: atts } = await supabase
        .from('attendance')
        .select('user_id, recorded_at')
        .eq('type', 'check_in')
        .in('user_id', list.map((u) => u.id))
        .order('recorded_at', { ascending: false })
        .limit(500);
      const map: Record<string, string> = {};
      for (const a of atts || []) {
        if (!map[a.user_id]) map[a.user_id] = a.recorded_at;
      }
      setLastCheckIns(map);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filtered = useMemo(() => {
    return employees.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (
        debouncedSearch &&
        !u.full_name.toLowerCase().includes(debouncedSearch) &&
        !u.email.toLowerCase().includes(debouncedSearch)
      )
        return false;
      return true;
    });
  }, [employees, debouncedSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAdd = async () => {
    setSaving(true);
    let res: Response;
    if (addForm.photo) {
      const fd = new FormData();
      fd.append('full_name', addForm.full_name);
      fd.append('email', addForm.email);
      fd.append('password', addForm.password);
      fd.append('phone', addForm.phone);
      fd.append('role', addForm.role);
      fd.append('photo', addForm.photo);
      res = await fetch('/api/employees', { method: 'POST', body: fd });
    } else {
      res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
    }
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      toast.addToast('error', json.error || 'Gagal menambahkan karyawan');
      return;
    }
    toast.addToast('success', `Karyawan ${addForm.full_name} berhasil ditambahkan`);
    setAddOpen(false);
    if (addForm.photoPreview) URL.revokeObjectURL(addForm.photoPreview);
    setAddForm({ full_name: '', email: '', password: '', phone: '', role: 'karyawan', photo: null, photoPreview: null });
    fetchEmployees();
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    let res: Response;
    if (editForm.photo) {
      const fd = new FormData();
      fd.append('full_name', editForm.full_name);
      fd.append('phone', editForm.phone);
      fd.append('role', editForm.role);
      fd.append('photo', editForm.photo);
      res = await fetch(`/api/employees/${editTarget.id}`, { method: 'PATCH', body: fd });
    } else {
      res = await fetch(`/api/employees/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
    }
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      toast.addToast('error', json.error || 'Gagal memperbarui');
      return;
    }
    toast.addToast('success', 'Data karyawan diperbarui');
    if (editForm.photoPreview) URL.revokeObjectURL(editForm.photoPreview);
    setEditTarget(null);
    setEditForm({ full_name: '', phone: '', role: 'karyawan', photo: null, photoPreview: null });
    fetchEmployees();
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setSaving(true);
    const res = await fetch(`/api/employees/${resetTarget.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      toast.addToast('error', json.error || 'Gagal reset password');
      return;
    }
    toast.addToast('success', `Password ${resetTarget.full_name} direset`);
    setResetTarget(null);
    setNewPassword('');
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    const res = await fetch(`/api/employees/${toggleTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !toggleTarget.is_active }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) {
      toast.addToast('error', 'Gagal mengubah status');
      return;
    }
    toast.addToast(
      'success',
      `${toggleTarget.full_name} ${toggleTarget.is_active ? 'dinonaktifkan' : 'diaktifkan'}`
    );
    setToggleTarget(null);
    fetchEmployees();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageTitle
        title="Karyawan"
        description="Kelola data dan akun karyawan"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Tambah Karyawan
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:grid-cols-3">
        <Input
          label="Cari"
          placeholder="Nama atau email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Semua Role</option>
          <option value="karyawan">Karyawan</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </Select>
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : paged.length === 0 ? (
        <EmptyState title="Belum ada karyawan" description="Tambahkan karyawan pertama Anda." />
      ) : (
        <>
          <TableWrapper>
            <Table>
              <THead>
                <tr>
                  <th>Karyawan</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Terakhir Check-in</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </THead>
              <TBody>
                {paged.map((emp) => (
                  <TR key={emp.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.full_name} src={emp.photo_url} size="sm" />
                        <div>
                          <p className="font-medium">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={emp.role === 'karyawan' ? 'primary' : 'default'} className="capitalize">
                        {emp.role}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={emp.is_active ? 'success' : 'danger'}>
                        {emp.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {lastCheckIns[emp.id]
                        ? new Date(lastCheckIns[emp.id]).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Belum pernah'}
                    </td>
                    <td>
                      {canManage(emp.role) ? (
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => {
                              setEditTarget(emp);
                              setEditForm({
                                full_name: emp.full_name,
                                phone: emp.phone ?? '',
                                role: emp.role,
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Reset password"
                            onClick={() => setResetTarget(emp)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={emp.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            onClick={() => setToggleTarget(emp)}
                          >
                            <Power className={`h-4 w-4 ${emp.is_active ? '' : 'text-success'}`} />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-muted-foreground">Khusus owner</p>
                      )}
                    </td>
                  </TR>
                ))}
                {paged.length === 0 && <EmptyRow colSpan={5}>Tidak ada data.</EmptyRow>}
              </TBody>
            </Table>
          </TableWrapper>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              totalItems={filtered.length}
              perPage={PER_PAGE}
            />
          )}
        </>
      )}

      <AddEmployeeModal
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        addForm={addForm}
        setAddForm={setAddForm}
        onAdd={handleAdd}
        saving={saving}
        isOwner={myRole === 'owner'}
      />

      <EditEmployeeModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        form={editForm}
        setForm={setEditForm}
        onSave={handleEdit}
        saving={saving}
        isOwner={myRole === 'owner'}
      />

      <ResetPasswordModal
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        password={newPassword}
        setPassword={setNewPassword}
        onSave={handleResetPassword}
        saving={saving}
      />

      <ToggleActiveModal
        target={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSave={handleToggleActive}
        saving={saving}
      />
    </div>
  );
}
