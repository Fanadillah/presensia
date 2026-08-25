'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/components/shared/Toast';
import { BRANDING } from '@/lib/branding';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lupa password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email atau password salah');
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin' || profile?.role === 'owner') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast.addToast('error', 'Masukkan email Anda terlebih dahulu');
      return;
    }
    setSendingReset(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (err) {
      toast.addToast('error', `Gagal mengirim email reset: ${err.message}`);
      return;
    }
    setForgotOpen(false);
    setForgotEmail('');
    toast.addToast('success', 'Link reset password telah dikirim ke email Anda. Periksa kotak masuk/spam.');
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/30">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{BRANDING.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{BRANDING.description.split(' — ')[0]}</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card-lg"
        >
          {error && (
            <div className="rounded-xl bg-danger-soft p-3 text-center text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@contoh.com"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? 'Masuk...' : 'Masuk'}
          </Button>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="w-full text-center text-sm font-medium text-primary hover:underline cursor-pointer"
          >
            Lupa password?
          </button>
        </form>
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Lupa Password">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Masukkan email yang terdaftar. Kami akan mengirimkan link untuk membuat password baru.
          </p>
          <Input
            label="Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="email@contoh.com"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setForgotOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleForgotPassword} loading={sendingReset}>
              Kirim Link Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
