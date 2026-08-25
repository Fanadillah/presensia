'use client';

import Link from 'next/link';
import { ArrowRight, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attendance } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';

export function RecentHistory() {
  const supabase = createClient();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(6);
      if (error) console.error('Gagal memuat riwayat:', error.message);
      setRecords(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">3 Hari Terakhir</h2>
        <Link
          href="/history"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Lihat semua <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : records.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada aktivitas absensi.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {records.map((r) => {
            const isIn = r.type === 'check_in';
            const Icon = isIn ? LogIn : LogOut;
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isIn ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isIn ? 'Check In' : 'Check Out'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.recorded_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.is_within_geofence === false
                        ? 'danger'
                        : isIn && r.is_late
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {new Date(r.recorded_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
