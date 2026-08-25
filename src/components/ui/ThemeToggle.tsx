'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle, mounted } = useTheme();

  if (!mounted) {
    return <div className={cn('h-10 w-10 rounded-xl bg-surface-muted animate-pulse', className)} />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer',
        className
      )}
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
