import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { deletePhoto, deletePhotosByFolder } from '@/lib/cloudinary';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const retentionDays = parseInt(process.env.PHOTO_RETENTION_DAYS || '3', 10);
    const cutoff = new Date(Date.now() - retentionDays * 86400000);
    const cutoffIso = cutoff.toISOString();

    // Plan B: hapus presisi via photo_public_id di DB (hemat API scan, anti salah hapus)
    // Fallback legacy: jika ada foto lama tanpa public_id, tetap scan folder Cloudinary
    let destroyedByPublicId = 0;
    let destroyedLegacy = 0;
    let dbNulled = 0;
    const failedIds: string[] = [];

    // 1) Query batch foto lama yang masih punya public_id (paginated 200 per batch biar <10s Vercel Hobby)
    const BATCH = 200;
    let hasMore = true;

    while (hasMore) {
      const { data: rows, error: fetchError } = await supabase
        .from('attendance')
        .select('id, photo_public_id')
        .not('photo_public_id', 'is', null)
        .lt('recorded_at', cutoffIso)
        .order('recorded_at', { ascending: true })
        .limit(BATCH);

      if (fetchError) throw fetchError;
      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      // 2) Destroy di Cloudinary satu-per-satu (presisi, idempotent)
      for (const r of rows as { id: string; photo_public_id: string }[]) {
        try {
          await deletePhoto(r.photo_public_id);
          destroyedByPublicId++;
        } catch (err) {
          // Jika foto sudah tidak ada di Cloudinary (sudah dihapus manual), anggap sukses untuk DB cleanup
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes('not found')) {
            destroyedByPublicId++;
          } else {
            console.error(`Failed to delete ${r.photo_public_id}:`, err);
            failedIds.push(r.id);
            continue; // jangan nullify baris yang gagal destroy
          }
        }
      }

      // 3) Nullify DB untuk batch yang sukses (exclude failedIds)
      const successIds = (rows as { id: string }[])
        .map((r) => r.id)
        .filter((id) => !failedIds.includes(id));

      if (successIds.length > 0) {
        const { error: updateError, count } = await supabase
          .from('attendance')
          .update({ photo_url: null, photo_public_id: null })
          .in('id', successIds)
          .select('id', { count: 'exact' });

        // Fallback jika select count tidak support di mock: pakai length
        if (updateError) {
          // Jika kolom photo_public_id belum ada (migrasi belum jalan), fallback ke photo_url only
          if (updateError.message.includes('photo_public_id')) {
            const { error: fallbackErr } = await supabase
              .from('attendance')
              .update({ photo_url: null })
              .in('id', successIds);
            if (fallbackErr) throw fallbackErr;
            dbNulled += successIds.length;
          } else {
            throw updateError;
          }
        } else {
          dbNulled += count ?? successIds.length;
        }
      }

      // Jika batch penuh, loop lagi; jika <BATCH, selesai
      if (rows.length < BATCH) hasMore = false;
    }

    // 4) Legacy fallback: scan Cloudinary folder untuk foto tanpa public_id (misal data lama sebelum Plan B)
    // Hanya jalan jika ada baris lama tanpa public_id tapi masih punya photo_url
    const { data: legacyRows } = await supabase
      .from('attendance')
      .select('id')
      .is('photo_public_id', null)
      .not('photo_url', 'is', null)
      .lt('recorded_at', cutoffIso)
      .limit(1);

    if (legacyRows && legacyRows.length > 0) {
      destroyedLegacy = await deletePhotosByFolder('attendance', retentionDays);
      // Setelah legacy scan, nullify semua legacy rows (tidak punya public_id jadi tidak bisa destroy presisi)
      const { data: allLegacy } = await supabase
        .from('attendance')
        .select('id')
        .is('photo_public_id', null)
        .not('photo_url', 'is', null)
        .lt('recorded_at', cutoffIso)
        .limit(500);

      if (allLegacy && allLegacy.length > 0) {
        const ids = (allLegacy as { id: string }[]).map((r) => r.id);
        await supabase.from('attendance').update({ photo_url: null }).in('id', ids);
        dbNulled += ids.length;
      }
    }

    // Leave attachments 3 hari juga (Opsi C)
    let leaveDestroyed = 0;
    let leaveNulled = 0;
    {
      const { data: leaveRows } = await supabase
        .from('leave_requests')
        .select('id, attachment_public_id')
        .not('attachment_public_id', 'is', null)
        .lt('created_at', cutoffIso)
        .limit(BATCH);
      if (leaveRows && (leaveRows as any[]).length > 0) {
        for (const r of leaveRows as { id: string; attachment_public_id: string }[]) {
          try { await deletePhoto(r.attachment_public_id); leaveDestroyed++; } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.toLowerCase().includes('not found')) leaveDestroyed++;
            else console.error('leave delete fail', r.attachment_public_id, e);
          }
        }
        const ids = (leaveRows as { id: string }[]).map(r=>r.id);
        const { error: leaveErr } = await supabase.from('leave_requests').update({ attachment_url: null, attachment_public_id: null } as any).in('id', ids);
        if (!leaveErr) leaveNulled = ids.length;
        else if (leaveErr.message.includes('attachment')) {
          await supabase.from('leave_requests').update({ attachment_url: null } as any).in('id', ids);
          leaveNulled = ids.length;
        }
      }
    }

    await supabase.from('audit_log').insert({
      action: 'cron_delete_photos',
      details: {
        retention_days: retentionDays,
        cutoff: cutoffIso,
        destroyed_by_public_id: destroyedByPublicId,
        destroyed_legacy_scan: destroyedLegacy,
        db_nulled: dbNulled,
        leave_destroyed: leaveDestroyed,
        leave_nulled: leaveNulled,
        failed_count: failedIds.length,
        mode: 'plan_b',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        retention_days: retentionDays,
        cutoff: cutoffIso,
        destroyed_by_public_id: destroyedByPublicId,
        destroyed_legacy_scan: destroyedLegacy,
        db_nulled: dbNulled,
        leave_destroyed: leaveDestroyed,
        leave_nulled: leaveNulled,
        failed_count: failedIds.length,
      },
    });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}

// Vercel Cron via GET juga (beberapa setup kirim GET) - reuse POST logic
export async function GET(request: Request) {
  return POST(request);
}
