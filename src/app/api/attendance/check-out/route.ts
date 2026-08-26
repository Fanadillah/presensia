import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { uploadPhoto } from '@/lib/cloudinary';
import { isWithinGeofence } from '@/lib/geofence';
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

    // Check if checked in today (ambil recorded_at juga untuk hitung durasi)
    const today = new Date().toISOString().split('T')[0];
    const { data: checkIn } = await supabase
      .from('attendance')
      .select('id, geofence_id, is_within_geofence, recorded_at')
      .eq('user_id', user.id)
      .eq('type', 'check_in')
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .order('recorded_at', { ascending: true })
      .limit(1);

    if (!checkIn || checkIn.length === 0) {
      return NextResponse.json({ success: false, error: 'Belum check-in hari ini' }, { status: 400 });
    }

    // Check if already checked out
    const { data: checkOut } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'check_out')
      .gte('recorded_at', `${today}T00:00:00`)
      .lte('recorded_at', `${today}T23:59:59`)
      .limit(1);

    if (checkOut && checkOut.length > 0) {
      return NextResponse.json({ success: false, error: 'Sudah check-out hari ini' }, { status: 400 });
    }

    // Check geofence (sama seperti check-in)
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

    // Hitung durasi kerja (menit)
    const recordedAtDate = new Date();
    const recordedAt = recordedAtDate.toISOString();
    let workDurationMinutes: number | null = null;
    if (checkIn?.[0]?.recorded_at) {
      workDurationMinutes = Math.max(
        0,
        Math.round(
          (recordedAtDate.getTime() - new Date(checkIn[0].recorded_at).getTime()) / 60000
        )
      );
    }

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
          type: 'check_out',
          photo_url: photoUrl,
          photo_public_id: photoPublicId,
          latitude,
          longitude,
          accuracy,
          is_within_geofence: isWithin,
          geofence_id: matchedGeofenceId ?? checkIn?.[0]?.geofence_id ?? null,
          work_duration_minutes: workDurationMinutes,
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
            type: 'check_out',
            photo_url: photoUrl,
            latitude,
            longitude,
            accuracy,
            is_within_geofence: isWithin,
            geofence_id: matchedGeofenceId ?? checkIn?.[0]?.geofence_id ?? null,
            work_duration_minutes: workDurationMinutes,
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
      action: 'check_out',
      details: {
        latitude,
        longitude,
        accuracy,
        work_duration_minutes: workDurationMinutes,
        geofence_name: matchedGeofenceName,
      },
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (err) {
    console.error('Check-out error:', err);
    return NextResponse.json({ success: false, error: 'Gagal check-out' }, { status: 500 });
  }
}
