import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRole, canManage, type Role } from '@/lib/rbac';
import { uploadPhoto } from '@/lib/cloudinary';
import { processAvatar } from '@/lib/avatar';
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const guard = await requireRole('admin');
    if ('error' in guard) {
      return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    }
    const { role: actorRole } = guard.auth;

    // Support JSON dan FormData (FormData untuk foto profil hybrid)
    const ct = request.headers.get('content-type') || '';
    let full_name = '', email = '', password = '', phone = '', role = 'karyawan';
    let avatarFile: File | null = null;
    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      full_name = (fd.get('full_name') as string) || '';
      email = (fd.get('email') as string) || '';
      password = (fd.get('password') as string) || '';
      phone = (fd.get('phone') as string) || '';
      role = (fd.get('role') as string) || 'karyawan';
      avatarFile = fd.get('photo') as File | null;
      if (avatarFile && avatarFile.size === 0) avatarFile = null;
    } else {
      const body = await request.json();
      ({ full_name, email, password, phone, role } = body as Record<string, string>);
    }

    if (!full_name?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Nama, email wajib diisi dan password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const validRoles: Role[] = ['karyawan', 'admin', 'owner'];
    let finalRole: Role = validRoles.includes(role as Role) ? (role as Role) : 'karyawan';

    // Hierarki: admin hanya bisa membuat akun karyawan
    if (!canManage(actorRole, finalRole)) {
      finalRole = 'karyawan';
    }

    const serviceSupabase = await createServiceClient();

    // Buat user di Supabase Auth
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authError || !authData.user) {
      const msg = authError?.message.toLowerCase().includes('already')
        ? 'Email sudah terdaftar'
        : authError?.message || 'Gagal membuat akun';
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    // Upload avatar jika ada (hybrid: admin set foto saat daftar)
    let photoUrl: string | null = null;
    if (avatarFile) {
      if (!ALLOWED_PHOTO_TYPES.includes(avatarFile.type)) {
        return NextResponse.json({ success: false, error: 'Tipe foto tidak didukung (jpg/png/webp)' }, { status: 400 });
      }
      if (avatarFile.size > MAX_PHOTO_SIZE) {
        return NextResponse.json({ success: false, error: 'Foto maksimal 5MB' }, { status: 400 });
      }
      const buf = Buffer.from(await avatarFile.arrayBuffer());
      const compressed = await processAvatar(buf);
      const up = await uploadPhoto(compressed, 'avatars');
      photoUrl = up.secure_url;
    }

    // Buat profil di tabel users
    const { data: profile, error: profileError } = await serviceSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role: finalRole,
        photo_url: photoUrl,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    await serviceSupabase.from('audit_log').insert({
      user_id: authData.user.id,
      action: 'employee_created',
      details: { created_by_role: actorRole, email: email.trim().toLowerCase(), role: finalRole },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (err) {
    console.error('Create employee error:', err);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan karyawan' }, { status: 500 });
  }
}
