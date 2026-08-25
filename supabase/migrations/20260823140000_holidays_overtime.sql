-- ============================================================
-- Migration: Hari Libur & Pengajuan Lembur
-- Tanggal: 23 Agustus 2026
-- ============================================================

-- ============================================================
-- 1) TABEL HOLIDAYS (hari libur nasional/perusahaan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Semua user terautentikasi boleh membaca daftar hari libur
DROP POLICY IF EXISTS "holidays_read_all" ON public.holidays;
CREATE POLICY "holidays_read_all" ON public.holidays
  FOR SELECT TO authenticated
  USING (true);

-- Kelola hanya admin/owner
DROP POLICY IF EXISTS "holidays_admin_insert" ON public.holidays;
CREATE POLICY "holidays_admin_insert" ON public.holidays
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "holidays_admin_update" ON public.holidays;
CREATE POLICY "holidays_admin_update" ON public.holidays
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

DROP POLICY IF EXISTS "holidays_admin_delete" ON public.holidays;
CREATE POLICY "holidays_admin_delete" ON public.holidays
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

-- ============================================================
-- 2) TABEL OVERTIME_REQUESTS (pengajuan lembur)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  work_date date NOT NULL,
  planned_hours numeric(4,1) NOT NULL DEFAULT 1,
  reason text NOT NULL,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_overtime_user ON public.overtime_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_overtime_status ON public.overtime_requests (status, work_date);

-- User melihat pengajuan sendiri; admin/owner melihat semua
DROP POLICY IF EXISTS "overtime_select_own_or_admin" ON public.overtime_requests;
CREATE POLICY "overtime_select_own_or_admin" ON public.overtime_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

-- User mengajukan untuk dirinya sendiri
DROP POLICY IF EXISTS "overtime_insert_own" ON public.overtime_requests;
CREATE POLICY "overtime_insert_own" ON public.overtime_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Approval anti-self; admin hanya memproses pengajuan karyawan
DROP POLICY IF EXISTS "overtime_update_admin" ON public.overtime_requests;
CREATE POLICY "overtime_update_admin" ON public.overtime_requests
  FOR UPDATE TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'owner'
      )
      AND public.overtime_requests.user_id <> auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'admin'
      )
      AND public.overtime_requests.user_id <> auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users t
        WHERE t.id = public.overtime_requests.user_id AND t.role = 'karyawan'
      )
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'owner'
      )
      AND public.overtime_requests.user_id <> auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'admin'
      )
      AND public.overtime_requests.user_id <> auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users t
        WHERE t.id = public.overtime_requests.user_id AND t.role = 'karyawan'
      )
    )
  );

DROP POLICY IF EXISTS "overtime_delete_own_pending" ON public.overtime_requests;
CREATE POLICY "overtime_delete_own_pending" ON public.overtime_requests
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
