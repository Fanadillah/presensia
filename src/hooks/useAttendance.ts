'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AttendanceToday, Attendance } from '@/types';

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const getToday = useCallback(async (): Promise<AttendanceToday | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const today = new Date().toISOString().split('T')[0];
      const { data, error: dbError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', `${today}T00:00:00`)
        .lte('recorded_at', `${today}T23:59:59`)
        .order('recorded_at', { ascending: false });

      if (dbError) throw dbError;

      const checkIn = data?.find((a: any) => a.type === 'check_in') || null;
      const checkOut = data?.find((a: any) => a.type === 'check_out') || null;

      return {
        has_check_in: !!checkIn,
        has_check_out: !!checkOut,
        check_in: checkIn,
        check_out: checkOut,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data');
      return null;
    }
  }, [supabase]);

  const checkIn = useCallback(
    async (photo: Blob, latitude: number, longitude: number, accuracy: number): Promise<Attendance | null> => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('photo', photo, 'selfie.jpg');
        formData.append('latitude', latitude.toString());
        formData.append('longitude', longitude.toString());
        formData.append('accuracy', accuracy.toString());

        const res = await fetch('/api/attendance/check-in', { method: 'POST', body: formData });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal check-in');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkOut = useCallback(
    async (photo: Blob, latitude: number, longitude: number, accuracy: number): Promise<Attendance | null> => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('photo', photo, 'selfie.jpg');
        formData.append('latitude', latitude.toString());
        formData.append('longitude', longitude.toString());
        formData.append('accuracy', accuracy.toString());

        const res = await fetch('/api/attendance/check-out', { method: 'POST', body: formData });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal check-out');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, getToday, checkIn, checkOut };
}
