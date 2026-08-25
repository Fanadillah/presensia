'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getMenu } from '@/lib/menu';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/shared/Modal';

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const menu = user ? getMenu(user.role) : [];
  const current = menu.find((m) => m.href === pathname);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-border/50 bg-background/60 px-8 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 lg:flex">
        <div className="flex items-center gap-2 text-sm">
          <Link href={user?.role === 'karyawan' ? '/' : '/dashboard'} className="font-medium text-muted-foreground hover:text-foreground">
            Presensia
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          <span className="font-semibold text-foreground">{current?.label ?? 'Halaman'}</span>
          {pathname !== '/' && pathname !== '/dashboard' && (
            <span className="ml-2 hidden text-xs text-muted-foreground xl:inline">— {current?.label ? 'Kelola kehadiran dengan glass terang' : ''}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-2 py-1 pr-3 shadow-sm hover:bg-surface-muted"
              >
                <Avatar name={user.full_name} src={user.photo_url} size="sm" />
                <span className="hidden text-sm font-medium text-foreground sm:inline">{user.full_name}</span>
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-surface p-2 shadow-card-lg">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-foreground">{user.full_name}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">{user.role} · {user.email}</p>
                    </div>
                    <div className="my-1 border-t border-border" />
                    <Link href="/profile" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted">
                      Profil
                    </Link>
                    <button onClick={() => { setOpen(false); setConfirmOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft">
                      <LogOut className="h-4 w-4" /> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Keluar Aplikasi">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin keluar?</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={logout}>Ya, Keluar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
