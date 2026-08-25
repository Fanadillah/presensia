'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { LeaveRequest } from '@/types';

export function useLeaves() {
  const supabase = createClient();
  const { isAdmin, loading: authLoading } = useAuth();
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLeaves([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('leave_requests')
        .select('*, user:users!leave_requests_user_id_fkey(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(200);

      // Karyawan hanya melihat pengajuannya sendiri; admin/owner melihat semua
      if (!isAdminRef.current) query = query.eq('user_id', user.id);

      const { data, error: err } = await query;

      if (err) {
        // Tabel belum dibuat (kode Postgres 42P01)
        if (err.code === '42P01') {
          setError('MIGRATION_MISSING');
        } else {
          console.error('Gagal memuat pengajuan:', err.message, err.code);
          setError(err.message || 'Terjadi kesalahan');
        }
        setLeaves([]);
      } else {
        setLeaves((data as LeaveRequest[]) || []);
      }
    } catch (e) {
      console.error('Gagal memuat pengajuan:', e);
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan jaringan');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch ulang ketika auth selesai loading DAN saat role berubah
  // (karyawan -> admin), agar scope query selalu benar.
  useEffect(() => {
    if (!authLoading) fetchLeaves();
  }, [authLoading, isAdmin, fetchLeaves]);

  return { leaves, loading, error, refetch: fetchLeaves };
}
