-- ============================================================
-- Migration: Redesain Presensia
-- Tanggal: 23 Agustus 2026
-- Jalankan di Supabase Dashboard > SQL Editor (sekali jalan)
-- ============================================================

-- ============================================================
-- 1) KOLOM BARU DI TABEL ATTENDANCE (Fase 4)
-- ============================================================
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS is_late boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS work_duration_minutes integer;

COMMENT ON COLUMN public.attendance.is_late IS 'True jika check-in melewati batas terlambat (jam masuk 08:00 + toleransi 15 menit)';
COMMENT ON COLUMN public.attendance.work_duration_minutes IS 'Durasi kerja dalam menit (check-out dikurangi check-in hari yang sama)';

CREATE INDEX IF NOT EXISTS idx_attendance_user_recorded
  ON public.attendance (user_id, recorded_at DESC);

-- ============================================================
-- 2) TABEL ANNOUNCEMENTS (Fase 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_active" ON public.announcements;
CREATE POLICY "announcements_select_active" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "announcements_admin_insert" ON public.announcements;
CREATE POLICY "announcements_admin_insert" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "announcements_admin_update" ON public.announcements;
CREATE POLICY "announcements_admin_update" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "announcements_admin_delete" ON public.announcements;
CREATE POLICY "announcements_admin_delete" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- 3) TABEL LEAVE_REQUESTS (Fase 9 - Cuti/Izin/Sakit)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.leave_type AS ENUM ('cuti', 'izin', 'sakit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type public.leave_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_dates_valid CHECK (end_date >= start_date)
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leave_requests_user
  ON public.leave_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
  ON public.leave_requests (status, start_date);

-- User melihat pengajuan sendiri; admin/owner melihat semua
DROP POLICY IF EXISTS "leave_select_own_or_admin" ON public.leave_requests;
CREATE POLICY "leave_select_own_or_admin" ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

-- User mengajukan untuk dirinya sendiri
DROP POLICY IF EXISTS "leave_insert_own" ON public.leave_requests;
CREATE POLICY "leave_insert_own" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Hanya admin/owner yang bisa update status
DROP POLICY IF EXISTS "leave_update_admin" ON public.leave_requests;
CREATE POLICY "leave_update_admin" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "leave_delete_own_pending" ON public.leave_requests;
CREATE POLICY "leave_delete_own_pending" ON public.leave_requests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- ============================================================
-- 4) DATA CONTOH PENGUMUMAN (opsional)
-- ============================================================
INSERT INTO public.announcements (title, body)
SELECT 'Selamat Datang di Sistem Absensi Baru',
       'Aplikasi absensi kini memiliki tampilan baru dengan peta lokasi, statistik kehadiran, dan pengajuan cuti/izin langsung dari aplikasi.'
WHERE NOT EXISTS (SELECT 1 FROM public.announcements);
