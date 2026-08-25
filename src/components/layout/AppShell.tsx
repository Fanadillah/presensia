'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { AuthGuard } from './AuthGuard';

export function AppShell({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  return (
    <AuthGuard adminOnly={adminOnly}>
      <div className="min-h-dvh bg-background">
        <Sidebar />
        <div className="lg:ml-[280px]">
          <Topbar />
          <main className="mx-auto max-w-[1280px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">{children}</main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
