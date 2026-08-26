-- ============================================================
-- Migration: Plan B - Photo public_id for precise cron delete
-- Tanggal: 24 Agustus 2026
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- Simpan public_id Cloudinary agar cron bisa destroy exakt (hemat API call,
-- tidak perlu scan Cloudinary folder + tidak salah hapus jika URL manual).
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS photo_public_id text;

COMMENT ON COLUMN public.attendance.photo_public_id IS 'Cloudinary public_id (mis. attendance/abc123) - untuk cron auto-delete presisi per 3 hari';

-- Index untuk cron: cari foto lama yang masih punya public_id
CREATE INDEX IF NOT EXISTS idx_attendance_photo_cleanup
  ON public.attendance (recorded_at)
  WHERE photo_public_id IS NOT NULL;

-- Index untuk filter foto yang sudah di-nullify
CREATE INDEX IF NOT EXISTS idx_attendance_photo_public_id
  ON public.attendance (photo_public_id)
  WHERE photo_public_id IS NOT NULL;
