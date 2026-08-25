'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/components/shared/Toast';
import type { Settings } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*').order('key');
      if (error) console.error('Gagal memuat pengaturan:', error.message);
      setSettings(data || []);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    let failed = 0;
    for (const s of settings) {
      const { error } = await supabase.from('settings').update({ value: s.value }).eq('id', s.id);
      if (error) failed++;
    }
    setSaving(false);
    if (failed > 0) {
      toast.addToast('error', `${failed} pengaturan gagal disimpan`);
    } else {
      toast.addToast('success', 'Pengaturan tersimpan');
    }
  };

  const updateValue = (id: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Pengaturan" description="Konfigurasi sistem absensi" />

      {loading ? (
        <SkeletonList rows={5} />
      ) : settings.length === 0 ? (
        <EmptyState
          title="Belum ada pengaturan"
          description="Tambahkan baris pada tabel settings di Supabase."
        />
      ) : (
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="space-y-4">
            {settings.map((s) => (
              <Input
                key={s.id}
                label={s.description || s.key}
                value={s.value || ''}
                onChange={(e) => updateValue(s.id, e.target.value)}
              />
            ))}
          </div>
          <Button onClick={handleSave} loading={saving} className="mt-6">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      )}
    </div>
  );
}
