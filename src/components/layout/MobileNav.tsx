'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getMenu, type MenuItem } from '@/lib/menu';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Modal } from '@/components/shared/Modal';

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const menu = user ? getMenu(user.role) : [];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen || confirmOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen, confirmOpen]);

  const visible = menu.slice(0, 3);
  const extra = menu.slice(3);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {visible.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
              drawerOpen ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-card-lg transition-transform duration-300',
            drawerOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Menu</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-surface-muted cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-card border border-border bg-surface-muted/60 p-3">
              <Avatar name={user.full_name} src={user.photo_url} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.full_name}
                </p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {user.role}
                </p>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => { setDrawerOpen(false); setConfirmOpen(true); }} aria-label="Keluar">
                <LogOut className="h-4 w-4 text-danger" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {(extra.length > 0 ? extra : menu).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted-foreground hover:bg-surface-muted'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Keluar Aplikasi">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin keluar dari akun ini?
          </p>
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
    </>
  );
}

function NavLink({ item, active }: { item: MenuItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-12 items-center justify-center rounded-full transition-all',
          active && 'bg-primary/10 scale-105'
        )}
      >
        <item.icon className="h-5 w-5" />
      </span>
      {item.label}
    </Link>
  );
}
