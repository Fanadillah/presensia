'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { OwnerGuard } from '@/components/layout/OwnerGuard';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OwnerGuard>
      <div className="min-h-dvh bg-background">
        <Sidebar />
        <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-64 lg:p-8 lg:pb-8">{children}</main>
        <MobileNav />
      </div>
    </OwnerGuard>
  );
}
