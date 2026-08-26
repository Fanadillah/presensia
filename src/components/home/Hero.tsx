'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getGreeting(hour: number): string {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function Hero() {
  const { user } = useAuth();

  if (!user) return null;
  const now = new Date();

  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-primary-hover to-[#1e3a8a] p-6 shadow-card-lg sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-blue-100">{getGreeting(now.getHours())},</p>
          <h1 className="mt-0.5 truncate text-xl font-bold text-white sm:text-3xl">
            {user.full_name} 👋
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge className="border border-white/20 bg-white/15 text-white capitalize">
              {user.role}
            </Badge>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:gap-3">
          <Avatar name={user.full_name} src={user.photo_url} size="xl" className="h-14 w-14 shrink-0 ring-4 ring-white/25 sm:h-20 sm:w-20" />
          <div className="hidden text-right text-sm text-blue-100 sm:block">
            <p className="font-semibold text-white">
              {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}{' '}
              {now.getFullYear()}
            </p>
          </div>
          <div className="text-right text-xs text-blue-100 sm:hidden">
            <p className="font-medium text-white">
              {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
