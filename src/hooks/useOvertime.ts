'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { OvertimeRequest } from '@/types';

export function useOvertime() {
  const supabase = createClient();
  const { isAdmin, loading: authLoading } = useAuth();
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  const [items, setItems] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('overtime_requests')
        .select('*, user:users!overtime_requests_user_id_fkey(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!isAdminRef.current) query = query.eq('user_id', user.id);

      const { data, error: err } = await query;
      if (err) {
        setError(err.code === '42P01' ? 'MIGRATION_MISSING' : err.message);
        setItems([]);
      } else {
        setItems((data as OvertimeRequest[]) || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading) fetchItems();
  }, [authLoading, isAdmin, fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}
