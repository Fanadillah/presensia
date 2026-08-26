import { describe, it, expect } from 'vitest';
import { calculateDistance, isWithinGeofence } from '@/lib/geofence';
import { isLateCheckIn, formatWorkDuration } from '@/lib/attendance';
import { canManage } from '@/lib/rbac';

// Integration: alur check-in seperti di route.ts (tanpa Supabase/Cloudinary)
function simulateCheckInFlow(params: {
  userLat: number;
  userLon: number;
  geofenceLat: number;
  geofenceLon: number;
  radius: number;
  recordedAt: Date;
  alreadyCheckedInToday: boolean;
}) {
  const within = isWithinGeofence(params.userLat, params.userLon, params.geofenceLat, params.geofenceLon, params.radius);
  const distance = calculateDistance(params.userLat, params.userLon, params.geofenceLat, params.geofenceLon);
  const late = isLateCheckIn(params.recordedAt);
  const canProceed = !params.alreadyCheckedInToday;
  return { within, distance, late, canProceed };
}

describe('integration: check-in flow', () => {
  const kantor = { lat: -6.2088, lon: 106.8456, radius: 100 };

  it('di dalam area + tepat waktu -> boleh absen, not late, is_within true', () => {
    const r = simulateCheckInFlow({
      userLat: kantor.lat + 0.0002,
      userLon: kantor.lon,
      geofenceLat: kantor.lat,
      geofenceLon: kantor.lon,
      radius: kantor.radius,
      recordedAt: new Date('2026-08-26T08:10:00'),
      alreadyCheckedInToday: false,
    });
    expect(r.within).toBe(true);
    expect(r.late).toBe(false);
    expect(r.canProceed).toBe(true);
    expect(r.distance).toBeLessThan(100);
  });

  it('di luar area tetap boleh absen tapi is_within false (sesuai spec flextime)', () => {
    const r = simulateCheckInFlow({
      userLat: kantor.lat + 0.01,
      userLon: kantor.lon + 0.01,
      geofenceLat: kantor.lat,
      geofenceLon: kantor.lon,
      radius: kantor.radius,
      recordedAt: new Date('2026-08-26T08:10:00'),
      alreadyCheckedInToday: false,
    });
    expect(r.within).toBe(false);
    expect(r.canProceed).toBe(true);
  });

  it('sudah check-in hari ini -> blokir', () => {
    const r = simulateCheckInFlow({
      userLat: kantor.lat,
      userLon: kantor.lon,
      geofenceLat: kantor.lat,
      geofenceLon: kantor.lon,
      radius: kantor.radius,
      recordedAt: new Date('2026-08-26T08:10:00'),
      alreadyCheckedInToday: true,
    });
    expect(r.canProceed).toBe(false);
  });

  it('terlambat setelah 08:15', () => {
    const r = simulateCheckInFlow({
      userLat: kantor.lat,
      userLon: kantor.lon,
      geofenceLat: kantor.lat,
      geofenceLon: kantor.lon,
      radius: kantor.radius,
      recordedAt: new Date('2026-08-26T08:30:00'),
      alreadyCheckedInToday: false,
    });
    expect(r.late).toBe(true);
  });

  it('durasi kerja check-out dihitung benar', () => {
    const checkIn = new Date('2026-08-26T08:00:00');
    const checkOut = new Date('2026-08-26T17:30:00');
    const mins = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
    expect(mins).toBe(570);
    expect(formatWorkDuration(mins)).toBe('9j 30m');
  });
});

describe('integration: RBAC + employee create guard', () => {
  it('admin coba buat akun admin -> downgrade ke karyawan (route.ts: canManage)', () => {
    const actor = 'admin' as const;
    const requested = 'admin' as const;
    const finalRole = canManage(actor, requested) ? requested : 'karyawan';
    expect(finalRole).toBe('karyawan');
  });

  it('owner buat akun admin -> lolos', () => {
    expect(canManage('owner', 'admin')).toBe(true);
  });
});

describe('integration: cron cut-off', () => {
  it('foto 4 hari lalu masuk cutoff 3 hari, foto hari ini tidak', () => {
    const retention = 3;
    const cutoff = new Date(Date.now() - retention * 86400000);
    const old = new Date(Date.now() - 4 * 86400000);
    const fresh = new Date();
    expect(old < cutoff).toBe(true);
    expect(fresh < cutoff).toBe(false);
  });
});
