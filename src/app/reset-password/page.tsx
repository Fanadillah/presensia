'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pastikan sesi recovery dari link email aktif sebelum menampilkan form
  useEffect(() => {
    supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    // Fallback: jika sesi sudah ada
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) setReady(true);
    });
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/login');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/30">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Password Baru</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buat password baru untuk akun Anda</p>
        </div>

        {!ready ? (
          <div className="rounded-card border border-border bg-surface p-6 text-center shadow-card-lg">
            <p className="text-sm text-muted-foreground">
              Memverifikasi link reset… Jika halaman tidak berubah, buka kembali link dari email
              Anda.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card-lg"
          >
            {error && (
              <div className="rounded-xl bg-danger-soft p-3 text-center text-sm font-medium text-danger">
                {error}
              </div>
            )}

            <Input
              label="Password Baru"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimal 6 karakter"
            />
            <Input
              label="Ulangi Password Baru"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <Button type="submit" loading={saving} className="w-full" size="lg">
              Simpan Password Baru
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
