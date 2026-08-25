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

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-100">{getGreeting(now.getHours())},</p>
          <h1 className="mt-0.5 text-2xl font-bold text-white sm:text-3xl">
            {user.full_name} 👋
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge className="border border-white/20 bg-white/15 text-white capitalize">
              {user.role}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Avatar name={user.full_name} src={user.photo_url} size="xl" className="ring-4 ring-white/25" />
          <div className="text-right text-sm text-blue-100">
            <p className="font-semibold text-white">
              {days[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}{' '}
              {now.getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
