import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { deletePhotosByFolder } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const retentionDays = parseInt(process.env.PHOTO_RETENTION_DAYS || '3', 10);

    // Delete photos from Cloudinary older than retention period
    const deletedCount = await deletePhotosByFolder('attendance', retentionDays);

    // Log audit
    await supabase.from('audit_log').insert({
      action: 'cron_delete_photos',
      details: { deleted_count: deletedCount, retention_days: retentionDays },
    });

    return NextResponse.json({
      success: true,
      data: { deleted_count: deletedCount, retention_days: retentionDays },
    });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}
