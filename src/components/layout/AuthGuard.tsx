'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/Button';

export function AuthGuard({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (adminOnly && user.role === 'karyawan') {
      router.replace('/');
    }
  }, [user, loading, router, adminOnly]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-card border border-danger/30 bg-surface p-6 text-center shadow-card-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Gagal Memuat</h2>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (adminOnly && user.role === 'karyawan') return null;

  return <>{children}</>;
}
