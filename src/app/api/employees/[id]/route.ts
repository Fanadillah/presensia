import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireRole, canManage, maxAssignableRole, type Role } from '@/lib/rbac';
import { deletePhoto, uploadPhoto } from '@/lib/cloudinary';
import { extractPublicId, processAvatar } from '@/lib/avatar';
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

async function getTargetRole(supabase: SupabaseClient, id: string): Promise<Role | null> {
  const { data } = await supabase.from('users').select('role').eq('id', id).maybeSingle();
  return (data?.role as Role) ?? null;
}

// Update profil (nama, telepon, role, status)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const guard = await requireRole('admin');
    if ('error' in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }
    const actor = guard.auth;
    const { id } = await params;

    const serviceSupabase = await createServiceClient();
    const targetRole = await getTargetRole(serviceSupabase, id);
    if (!targetRole) {
      return NextResponse.json({ success: false, error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    // Hierarki: admin hanya boleh mengelola akun karyawan
    if (!canManage(actor.role, targetRole)) {
      return NextResponse.json(
        { success: false, error: `Hanya owner yang dapat mengelola akun ${targetRole}` },
        { status: 403 }
      );
    }

    const ct = request.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};
    let avatarFile: File | null = null;
    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      body = {
        full_name: fd.get('full_name') as string,
        phone: fd.get('phone') as string,
        role: fd.get('role') as string,
        is_active: fd.get('is_active') ? (fd.get('is_active') as string) === 'true' : undefined,
      };
      avatarFile = fd.get('photo') as File | null;
      if (avatarFile && avatarFile.size === 0) avatarFile = null;
    } else {
      body = await request.json();
    }
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.full_name === 'string' && body.full_name.trim()) updates.full_name = (body.full_name as string).trim();
    if (typeof body.phone === 'string') updates.phone = (body.phone as string).trim() || null;
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

    // Perubahan role dibatasi ceiling sesuai hierarki
    if (body.role && ['karyawan', 'admin', 'owner'].includes(body.role as string)) {
      const newRole = body.role as Role;
      if (newRole !== targetRole) {
        if (!canManage(actor.role, targetRole)) {
          return NextResponse.json({ success: false, error: 'Tidak berhak mengubah akun ini' }, { status: 403 });
        }
        if (!canManage(actor.role, newRole)) {
          return NextResponse.json(
            { success: false, error: `Anda hanya dapat menetapkan role maksimal "${maxAssignableRole(actor.role)}"` },
            { status: 403 }
          );
        }
        updates.role = newRole;
      }
    }

    // Handle foto profil jika ada (admin ganti foto karyawan)
    if (avatarFile) {
      if (!ALLOWED_PHOTO_TYPES.includes(avatarFile.type)) {
        return NextResponse.json({ success: false, error: 'Tipe foto tidak didukung' }, { status: 400 });
      }
      if (avatarFile.size > MAX_PHOTO_SIZE) {
        return NextResponse.json({ success: false, error: 'Foto maksimal 5MB' }, { status: 400 });
      }
      // Hapus foto lama jika ada
      const { data: existing } = await serviceSupabase.from('users').select('photo_url').eq('id', id).maybeSingle();
      const oldId = extractPublicId((existing as { photo_url?: string } | null)?.photo_url);
      const buf = Buffer.from(await avatarFile.arrayBuffer());
      const compressed = await processAvatar(buf);
      const up = await uploadPhoto(compressed, 'avatars');
      updates.photo_url = up.secure_url;
      if (oldId) {
        try { await deletePhoto(oldId); } catch (e) { console.error('Failed delete old avatar', e); }
      }
    }

    const { data, error } = await serviceSupabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Update employee error:', err);
    return NextResponse.json({ success: false, error: 'Gagal memperbarui karyawan' }, { status: 500 });
  }
}

// Reset password
export async function POST(request: Request, { params }: Params) {
  try {
    const guard = await requireRole('admin');
    if ('error' in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }
    const actor = guard.auth;
    const { id } = await params;

    const supabase = await createClient();
    const targetRole = await getTargetRole(supabase, id);
    if (!targetRole) {
      return NextResponse.json({ success: false, error: 'Akun tidak ditemukan' }, { status: 404 });
    }
    if (!canManage(actor.role, targetRole)) {
      return NextResponse.json(
        { success: false, error: `Hanya owner yang dapat reset password akun ${targetRole}` },
        { status: 403 }
      );
    }

    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();
    const { error } = await serviceSupabase.auth.admin.updateUserById(id, { password });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await serviceSupabase.from('audit_log').insert({
      user_id: id,
      action: 'password_reset_by_admin',
      details: { performed_by_role: actor.role },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ success: false, error: 'Gagal reset password' }, { status: 500 });
  }
}
