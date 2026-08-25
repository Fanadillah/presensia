-- ============================================================
-- Migration: Hierarki Role & Anti-Kecurangan
-- Tanggal: 23 Agustus 2026
-- Hierarki: karyawan < admin < owner
-- ============================================================

-- ============================================================
-- 1) GEOFENCE: kelola titik kantor HANYA owner
--    (mengganti policy "Admins ..." sebelumnya)
-- ============================================================
DROP POLICY IF EXISTS "Admins insert geofence" ON public.geofence;
DROP POLICY IF EXISTS "Admins update geofence" ON public.geofence;
DROP POLICY IF EXISTS "Admins delete geofence" ON public.geofence;

CREATE POLICY "Owners insert geofence" ON public.geofence
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

CREATE POLICY "Owners update geofence" ON public.geofence
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

CREATE POLICY "Owners delete geofence" ON public.geofence
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

-- Semua user tetap bisa membaca daftar geofence (dibutuhkan saat absen)

-- ============================================================
-- 2) SETTINGS: konfigurasi sistem HANYA owner
-- ============================================================
DROP POLICY IF EXISTS "All users read settings" ON public.settings;

CREATE POLICY "Owners read settings" ON public.settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

CREATE POLICY "Owners update settings" ON public.settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'owner'
    )
  );

-- ============================================================
-- 3) LEAVE_REQUESTS: approval tidak bisa dilakukan sendiri,
--    dan admin hanya boleh memproses pengajuan KARYAWAN.
--    (Pengajuan milik admin/owner hanya bisa diproses owner.)
-- ============================================================
DROP POLICY IF EXISTS "leave_update_admin" ON public.leave_requests;

CREATE POLICY "leave_update_admin" ON public.leave_requests
  FOR UPDATE TO authenticated
  USING (
    -- Approver adalah OWNER: boleh memproses semua pengajuan kecuali miliknya sendiri
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'owner'
      )
      AND public.leave_requests.user_id <> auth.uid()
    )
    OR
    -- Approver adalah ADMIN: hanya pengajuan milik KARYAWAN lain
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'admin'
      )
      AND public.leave_requests.user_id <> auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users t
        WHERE t.id = public.leave_requests.user_id AND t.role = 'karyawan'
      )
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'owner'
      )
      AND public.leave_requests.user_id <> auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.users a
        WHERE a.id = auth.uid() AND a.role = 'admin'
      )
      AND public.leave_requests.user_id <> auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.users t
        WHERE t.id = public.leave_requests.user_id AND t.role = 'karyawan'
      )
    )
  );
