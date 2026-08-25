'use client';

import { useState } from 'react';
import { PlaneTakeoff, Timer } from 'lucide-react';
import { PageTitle } from '@/components/shared/PageTitle';
import { LeaveAdminTab } from './LeaveAdminTab';
import { OvertimeAdminTab } from './OvertimeAdminTab';
import { cn } from '@/lib/utils';

type Tab = 'cuti' | 'lembur';

export default function LeavesAdminPage() {
  const [tab, setTab] = useState<Tab>('cuti');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageTitle title="Approval Cuti & Lembur" description="Proses pengajuan karyawan" />

      <div className="grid grid-cols-2 gap-2 rounded-card border border-border bg-surface p-2 shadow-card">
        <button
          onClick={() => setTab('cuti')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer',
            tab === 'cuti'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-surface-muted'
          )}
        >
          <PlaneTakeoff className="h-4 w-4" />
          Cuti & Izin
        </button>
        <button
          onClick={() => setTab('lembur')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer',
            tab === 'lembur'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-surface-muted'
          )}
        >
          <Timer className="h-4 w-4" />
          Lembur
        </button>
      </div>

      {tab === 'cuti' ? <LeaveAdminTab /> : <OvertimeAdminTab />}
    </div>
  );
}
