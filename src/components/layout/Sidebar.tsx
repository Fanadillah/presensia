'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getMenu } from '@/lib/menu';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/shared/Modal';
import { LiveClock } from '@/components/shared/LiveClock';
import { BRANDING } from '@/lib/branding';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const menu = user ? getMenu(user.role) : [];
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Group menu untuk ciri khas desktop: Utama vs Kelola
  const utamaHrefs = new Set(['/', '/absen', '/history', '/leave', '/profile']);
  const utama = menu.filter((m) => utamaHrefs.has(m.href));
  const kelola = menu.filter((m) => !utamaHrefs.has(m.href));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-border/60 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:bg-[#0f1a2e]/75 dark:backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.06)] lg:flex">
      {/* Header glass terang */}
      <div className="flex items-center gap-3 border-b border-border/50 px-5 py-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-hover shadow-md shadow-primary/20">
          <Clock className="h-5 w-5 text-white" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-white shadow ring-2 ring-primary/20" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-extrabold tracking-tight text-foreground">{BRANDING.name}</h1>
          <p className="truncate text-[11px] font-medium text-muted-foreground">{BRANDING.description.split(' — ')[0]}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {utama.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">Utama</p>
            <div className="space-y-1">
              {utama.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all',
                      isActive
                        ? 'border-primary/15 bg-primary text-white shadow-md shadow-primary/20'
                        : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-surface-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px] transition-transform group-hover:scale-110', isActive && 'drop-shadow')} />
                    {item.label}
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90 shadow" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {kelola.length > 0 && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">Kelola</p>
            <div className="space-y-1">
              {kelola.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all',
                      isActive
                        ? 'border-primary/15 bg-primary text-white shadow-md shadow-primary/20'
                        : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-surface-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px] transition-transform group-hover:scale-110', isActive && 'drop-shadow')} />
                    {item.label}
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="border-t border-border/50 p-4">
          <div className="mb-3 rounded-xl border border-border/50 bg-surface/80 px-3 py-2.5 backdrop-blur">
            <LiveClock />
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-muted/60 p-2.5">
            <Avatar name={user.full_name} src={user.photo_url} size="sm" className="ring-2 ring-white dark:ring-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.full_name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{user.role}</p>
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground cursor-pointer"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Keluar Aplikasi">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin keluar dari akun ini?</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" className="flex-1" onClick={logout}>
              Ya, Keluar
            </Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
