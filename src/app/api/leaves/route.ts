import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { uploadPhoto } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const type = formData.get('type') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const reason = formData.get('reason') as string;
    const file = formData.get('file') as File | null;

    if (!type || !start_date || !end_date || !reason) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
    }
    if (!['cuti','izin','sakit'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Tipe tidak valid' }, { status: 400 });
    }
    if (end_date < start_date) {
      return NextResponse.json({ success: false, error: 'Tanggal selesai tidak boleh sebelum mulai' }, { status: 400 });
    }

    let attachment_url: string | null = null;
    let attachment_public_id: string | null = null;

    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'File terlalu besar (max 5MB)' }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const res = await uploadPhoto(buf, 'leave');
      attachment_url = res.secure_url;
      attachment_public_id = res.public_id;
    }

    const service = await createServiceClient();
    // Try insert with attachment columns, fallback without if migration not yet run
    let data: any = null;
    let err: any = null;
    {
      const res = await supabase.from('leave_requests').insert({
        user_id: user.id,
        type,
        start_date,
        end_date,
        reason: reason.trim(),
        attachment_url,
        attachment_public_id,
      } as any).select().single();
      data = res.data; err = res.error;
      if (err && String(err.message||'').includes('attachment')) {
        const retry = await supabase.from('leave_requests').insert({
          user_id: user.id,
          type,
          start_date,
          end_date,
          reason: reason.trim(),
        } as any).select().single();
        data = retry.data; err = retry.error;
      }
    }

    if (err) throw err;

    await service.from('audit_log').insert({
      user_id: user.id,
      action: 'leave_request',
      details: { type, start_date, end_date, has_attachment: !!attachment_url },
    });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('Leave POST error', e);
    return NextResponse.json({ success: false, error: e.message || 'Gagal' }, { status: 500 });
  }
}
