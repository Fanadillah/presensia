import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { deletePhoto, uploadPhoto } from '@/lib/cloudinary';
import { extractPublicId, processAvatar } from '@/lib/avatar';
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_SIZE } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Foto wajib diisi' }, { status: 400 });
    }
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Tipe foto tidak didukung (jpg/png/webp)' }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ success: false, error: 'Foto maksimal 5MB' }, { status: 400 });
    }

    // Hapus foto lama jika ada
    const { data: existing } = await supabase.from('users').select('photo_url').eq('id', user.id).maybeSingle();
    const oldId = extractPublicId((existing as { photo_url?: string } | null)?.photo_url);

    const buf = Buffer.from(await file.arrayBuffer());
    const compressed = await processAvatar(buf);
    const up = await uploadPhoto(compressed, 'avatars');

    const serviceSupabase = await createServiceClient();
    const { error: updError } = await serviceSupabase
      .from('users')
      .update({ photo_url: up.secure_url, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (updError) throw updError;

    if (oldId) {
      try { await deletePhoto(oldId); } catch (e) { console.error('Failed delete old avatar', e); }
    }

    await serviceSupabase.from('audit_log').insert({
      user_id: user.id,
      action: 'profile_photo_updated',
      details: { photo_url: up.secure_url },
    });

    return NextResponse.json({ success: true, data: { photo_url: up.secure_url } });
  } catch (err) {
    console.error('Profile photo error:', err);
    return NextResponse.json({ success: false, error: 'Gagal update foto profil' }, { status: 500 });
  }
}
