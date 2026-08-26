import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { uploadPhoto } from '@/lib/cloudinary';
import { isWithinGeofence } from '@/lib/geofence';
import { isLateCheckIn } from '@/lib/attendance';
import { addAttendanceWatermark } from '@/lib/watermark';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const accuracy = parseFloat(formData.get('accuracy') as string);

    if (!photo || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Check geofence (dulu, agar watermark memuat status area yang benar)
    const serviceSupabase = await createServiceClient();
    const { data: geofences } = await serviceSupabase
      .from('geofence')
      .select('*')
      .eq('is_active', true);

    let isWithin = false;
    let matchedGeofenceId: string | null = null;
    let matchedGeofenceName: string | null = null;

    if (geofences) {
      for (const g of geofences) {
        if (isWithinGeofence(latitude, longitude, g.latitude, g.longitude, g.radius_meters)) {
          isWithin = true;
          matchedGeofenceId = g.id;
          matchedGeofenceName = g.name;
          break;
        }
      }
    }

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'check_in')
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, error: 'Sudah check-in hari ini' }, { status: 400 });
    }

    const recordedAtDate = new Date();
    const recordedAt = recordedAtDate.toISOString();

    // Watermark foto: tanggal-jam + koordinat + status area
    const watermarked = await addAttendanceWatermark(Buffer.from(await photo.arrayBuffer()), {
      recordedAt: recordedAtDate,
      latitude,
      longitude,
      accuracy,
      withinGeofence: isWithin,
      geofenceName: matchedGeofenceName,
    });

    // Upload to Cloudinary (Plan B: simpan public_id untuk cron presisi)
    const uploadResult = await uploadPhoto(watermarked, 'attendance');
    const photoUrl = uploadResult.secure_url;
    const photoPublicId = uploadResult.public_id;

    // Insert attendance (fallback jika migrasi photo_public_id belum jalan)
    let attendance: unknown = null;
    let insertError: unknown = null;
    {
      const res = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          type: 'check_in',
          photo_url: photoUrl,
          photo_public_id: photoPublicId,
          latitude,
          longitude,
          accuracy,
          is_within_geofence: isWithin,
          geofence_id: matchedGeofenceId,
          is_late: isLateCheckIn(recordedAtDate),
          recorded_at: recordedAt,
        })
        .select()
        .single();
      attendance = res.data;
      insertError = res.error;
      if (insertError && String((insertError as { message?: string }).message || '').includes('photo_public_id')) {
        const retry = await supabase
          .from('attendance')
          .insert({
            user_id: user.id,
            type: 'check_in',
            photo_url: photoUrl,
            latitude,
            longitude,
            accuracy,
            is_within_geofence: isWithin,
            geofence_id: matchedGeofenceId,
            is_late: isLateCheckIn(recordedAtDate),
            recorded_at: recordedAt,
          })
          .select()
          .single();
        attendance = retry.data;
        insertError = retry.error;
      }
    }
    if (insertError) throw insertError;

    // Audit log
    await serviceSupabase.from('audit_log').insert({
      user_id: user.id,
      action: 'check_in',
      details: {
        latitude,
        longitude,
        accuracy,
        is_within_geofence: isWithin,
        geofence_name: matchedGeofenceName,
        is_late: isLateCheckIn(recordedAtDate),
      },
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (err) {
    console.error('Check-in error:', err);
    return NextResponse.json({ success: false, error: 'Gagal check-in' }, { status: 500 });
  }
}
