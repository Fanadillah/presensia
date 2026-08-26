import { describe, it, expect } from 'vitest';
import { calculateDistance, isWithinGeofence } from './geofence';

describe('calculateDistance', () => {
  it('jarak titik sama = 0', () => {
    expect(calculateDistance(-6.2, 106.8, -6.2, 106.8)).toBeCloseTo(0, 5);
  });

  it('jarak Jakarta Monas ke Bundaran HI ~ ~3km', () => {
    // Monas -6.17511,106.865039 -> Bundaran HI -6.195,106.822
    const d = calculateDistance(-6.17511, 106.865039, -6.195, 106.822);
    expect(d).toBeGreaterThan(4000);
    expect(d).toBeLessThan(7000);
  });

  it('haversine 1 derajat latitude ~111km', () => {
    const d = calculateDistance(0, 0, 1, 0);
    expect(d).toBeCloseTo(111194, -2); // toleransi 100m
  });

  it('simetris', () => {
    const a = calculateDistance(-6.2, 106.8, -6.3, 106.9);
    const b = calculateDistance(-6.3, 106.9, -6.2, 106.8);
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('isWithinGeofence', () => {
  const kantorLat = -6.2088;
  const kantorLon = 106.8456;
  const radius = 100;

  it('dalam radius 100m -> true', () => {
    // 30m geser utara (~0.00027 deg)
    expect(isWithinGeofence(kantorLat + 0.00027, kantorLon, kantorLat, kantorLon, radius)).toBe(true);
  });

  it('di luar radius -> false', () => {
    // 200m geser
    expect(isWithinGeofence(kantorLat + 0.0018, kantorLon, kantorLat, kantorLon, radius)).toBe(false);
  });

  it('tepat di batas -> true (<=)', () => {
    // hitung titik 100m utara
    const delta = (100 / 6371000) * (180 / Math.PI);
    expect(isWithinGeofence(kantorLat + delta, kantorLon, kantorLat, kantorLon, radius)).toBe(true);
  });

  it('radius 0 hanya titik exakt', () => {
    expect(isWithinGeofence(kantorLat, kantorLon, kantorLat, kantorLon, 0)).toBe(true);
    expect(isWithinGeofence(kantorLat + 0.00001, kantorLon, kantorLat, kantorLon, 0)).toBe(false);
  });
});
