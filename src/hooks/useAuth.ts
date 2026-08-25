'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('[useAuth] getUser error:', authError.message);
          setState({ user: null, loading: false, error: authError.message });
          return;
        }
        if (!authUser) {
          setState({ user: null, loading: false, error: null });
          return;
        }
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (profileError) {
          console.error('[useAuth] Profile query error:', profileError.message, profileError.code);
          setState({ user: null, loading: false, error: `Gagal memuat profil: ${profileError.message}` });
          return;
        }
        if (!data) {
          const res = await fetch('/api/auth/ensure-profile', { method: 'POST' });
          const json = await res.json();
          if (!json.success) {
            console.error('[useAuth] Failed to create profile:', json.error);
            setState({ user: null, loading: false, error: `Gagal membuat profil: ${json.error}` });
            return;
          }
          setState({ user: json.data, loading: false, error: null });
          return;
        }
        setState({ user: data, loading: false, error: null });
      } catch (err) {
        console.error('[useAuth] Unexpected error:', err);
        setState({ user: null, loading: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    };
    getUser();
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = '/login';
  }, []);

  const isAdmin = state.user?.role === 'admin' || state.user?.role === 'owner';

  return { ...state, logout, isAdmin };
}
