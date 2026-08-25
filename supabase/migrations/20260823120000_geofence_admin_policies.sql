-- ============================================================
-- Migration: Policy CRUD Geofence untuk Admin
-- Tanggal: 23 Agustus 2026
-- Latar belakang: tabel geofence sebelumnya hanya punya policy SELECT,
-- sehingga admin tidak bisa menambah/mengubah/menghapus lokasi dari UI.
-- ============================================================

-- Admin/Owner boleh menambah lokasi kantor
DROP POLICY IF EXISTS "Admins insert geofence" ON public.geofence;
CREATE POLICY "Admins insert geofence" ON public.geofence
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );

-- Admin/Owner boleh mengubah lokasi (nama, koordinat, radius, status aktif)
DROP POLICY IF EXISTS "Admins update geofence" ON public.geofence;
CREATE POLICY "Admins update geofence" ON public.geofence
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

-- Admin/Owner boleh menghapus lokasi
DROP POLICY IF EXISTS "Admins delete geofence" ON public.geofence;
CREATE POLICY "Admins delete geofence" ON public.geofence
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'owner')
    )
  );
