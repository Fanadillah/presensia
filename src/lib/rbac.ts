import { createClient } from '@/lib/supabase/server';

export type Role = 'karyawan' | 'admin' | 'owner';

const ROLE_LEVEL: Record<Role, number> = {
  karyawan: 1,
  admin: 2,
  owner: 3,
};

export interface AuthContext {
  userId: string;
  role: Role;
}

/**
 * Guard bertingkat. `minimum` = role terendah yang boleh lewat.
 * Contoh: requireRole('admin') -> admin & owner lolos.
 */
export async function requireRole(
  minimum: Exclude<Role, 'karyawan'> | Role
): Promise<{ error: string; status: number } | { auth: AuthContext }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!me) return { error: 'Profil tidak ditemukan', status: 403 };

  const myRole = me.role as Role;
  if (ROLE_LEVEL[myRole] < ROLE_LEVEL[minimum as Role]) {
    return { error: 'Forbidden', status: 403 };
  }

  return { auth: { userId: user.id, role: myRole } };
}

/** True jika `actor` boleh mengelola akun dengan role `target`. */
export function canManage(actor: Role, target: Role): boolean {
  // Owner bisa kelola siapa pun kecuali sesama/owner lain (hanya owner > owner tidak ada)
  if (actor === 'owner') return true;
  // Admin hanya boleh kelola karyawan
  if (actor === 'admin') return target === 'karyawan';
  return false;
}

/** Role tertinggi yang boleh diberikan oleh `actor` saat membuat/mengubah akun. */
export function maxAssignableRole(actor: Role): Role {
  return actor === 'owner' ? 'owner' : 'karyawan';
}
