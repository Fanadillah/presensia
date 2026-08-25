'use client';

import { Hero } from '@/components/home/Hero';
import { TodayStatusCard } from '@/components/home/TodayStatusCard';
import { MonthlyStats } from '@/components/home/MonthlyStats';
import { NearbyOffice } from '@/components/home/NearbyOffice';
import { Announcements } from '@/components/home/Announcements';
import { RecentHistory } from '@/components/home/RecentHistory';
import { PresenceCalendar } from '@/components/calendar/PresenceCalendar';
import { useMonthlyPresence } from '@/hooks/useMonthlyPresence';
import { useHolidays } from '@/hooks/useHolidays';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const now = new Date();
  const presence = useMonthlyPresence(now.getFullYear(), now.getMonth() + 1);
  const holidays = useHolidays();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Hero />
      <TodayStatusCard />
      <MonthlyStats />

      <div className="grid gap-5 lg:grid-cols-2">
        <NearbyOffice />
        <Announcements />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Kalender Bulan Ini
          </h2>
          <PresenceCalendar
            year={now.getFullYear()}
            month={now.getMonth() + 1}
            days={presence.days}
            leaves={presence.leaves}
            holidays={holidays.map}
            compact
            loading={presence.loading}
          />
        </Card>
        <RecentHistory />
      </div>
    </div>
  );
}
