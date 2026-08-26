import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { addAttendanceWatermark } from './watermark';

describe('watermark', () => {
  it('memberi stempel dan resize ke max 720', async () => {
    const input = await sharp({
      create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 50, b: 50 } },
    })
      .jpeg()
      .toBuffer();

    const out = await addAttendanceWatermark(input, {
      recordedAt: new Date('2026-08-26T08:15:00'),
      latitude: -6.2088,
      longitude: 106.8456,
      accuracy: 12,
      withinGeofence: true,
      geofenceName: 'Kantor Pusat',
    });

    expect(out).toBeInstanceOf(Buffer);
    const meta = await sharp(out).metadata();
    expect(meta.width).toBeLessThanOrEqual(720);
    expect(meta.format).toBe('jpeg');
    // watermark menyatu -> buffer berubah
    expect(out.length).not.toBe(input.length);
  });

  it('fallback ke input jika buffer bukan gambar', async () => {
    const bad = Buffer.from('bukan-gambar');
    const out = await addAttendanceWatermark(bad, {
      recordedAt: new Date(),
      latitude: 0,
      longitude: 0,
      withinGeofence: false,
    });
    expect(out).toEqual(bad);
  });
});
