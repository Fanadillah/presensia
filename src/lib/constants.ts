import { BRANDING } from './branding';

export const APP_NAME = BRANDING.name;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const ROLES = {
  KARYAWAN: 'karyawan',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const;

export const ATTENDANCE_TYPE = {
  CHECK_IN: 'check_in',
  CHECK_OUT: 'check_out',
} as const;

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_RETENTION_DAYS = 3;

// Opsi A — kompresi hemat storage (target 80-150KB per foto)
export const PHOTO_MAX_WIDTH = 720; // px — resize server-side (inside, tanpa upscale)
export const PHOTO_JPEG_QUALITY = 70; // server sharp quality (mozjpeg)
export const PHOTO_CLIENT_MAX_WIDTH = 1024; // px — resize client sebelum upload (hemat bandwidth)
export const PHOTO_CLIENT_QUALITY = 0.75; // client canvas.toBlob quality
export const PHOTO_TARGET_MAX_BYTES = 150 * 1024; // 150KB target untuk logging/monitoring

export const DEFAULT_GEOFENCE_RADIUS = 100; // meters

export const WORK_SCHEDULE = {
  CHECK_IN_START: '08:00',
  CHECK_IN_END: '09:00',
  CHECK_OUT_START: '17:00',
  CHECK_OUT_END: '18:00',
  LATE_THRESHOLD_MINUTES: 15,
} as const;

export const DEFAULT_WORK_SCHEDULE = WORK_SCHEDULE;
