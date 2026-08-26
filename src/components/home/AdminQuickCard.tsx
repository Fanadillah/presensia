'use client';

import Link from 'next/link';
import { LayoutDashboard, ClipboardList, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function AdminQuickCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Kelola Tim</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Kamu login sebagai <span className="font-semibold text-foreground">Admin</span> — absen tetap bisa, plus kelola tim.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-hover"
        >
          <LayoutDashboard className="h-4 w-4" />
          Buka Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/attendance" className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-3 text-xs font-medium hover:bg-surface-muted">
          <ClipboardList className="h-5 w-5 text-primary" /> Rekap
        </Link>
        <Link href="/employees" className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-3 text-xs font-medium hover:bg-surface-muted">
          <Users className="h-5 w-5 text-primary" /> Karyawan
        </Link>
        <Link href="/leaves" className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-3 text-xs font-medium hover:bg-surface-muted">
          <LayoutDashboard className="h-5 w-5 text-primary" /> Cuti
        </Link>
      </div>
    </Card>
  );
}
