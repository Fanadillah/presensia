'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Announcement } from '@/types';
import { SkeletonList } from '@/components/ui/Skeleton';

export function Announcements() {
  const supabase = createClient();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      // Tabel belum dibuat → sembunyikan section tanpa error
      if (error) {
        if (!/relation|does not exist|schema/i.test(error.message)) {
          console.error('Gagal memuat pengumuman:', error.message);
        }
        setHidden(true);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (hidden) return null;

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Megaphone className="h-4 w-4" />
        Pengumuman
      </h2>

      {loading ? (
        <SkeletonList rows={2} />
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada pengumuman.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                <time className="flex-shrink-0 text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {a.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
