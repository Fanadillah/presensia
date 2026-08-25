'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Holiday } from '@/types';

interface HolidaysState {
  loading: boolean;
  error: boolean;
  /** key = yyyy-mm-dd */
  map: Record<string, string>;
  list: Holiday[];
}

/** Ambil semua hari libur (jumlahnya kecil). Dipakai kalender, dashboard, payroll. */
export function useHolidays(): HolidaysState {
  const [state, setState] = useState<HolidaysState>({
    loading: true,
    error: false,
    map: {},
    list: [],
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('holidays')
          .select('*')
          .order('date', { ascending: true });

        if (!cancelled) {
          if (error) {
            // Tabel belum ada -> anggap kosong tanpa gangguan UI
            setState({ loading: false, error: true, map: {}, list: [] });
            return;
          }
          const map: Record<string, string> = {};
          for (const h of (data as Holiday[]) || []) map[h.date] = h.name;
          setState({ loading: false, error: false, map, list: (data as Holiday[]) || [] });
        }
      } catch {
        if (!cancelled) setState({ loading: false, error: true, map: {}, list: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}
