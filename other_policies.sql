-- ============================================
-- RLS Policies untuk tabel lainnya
-- Jalankan di Supabase SQL Editor atau via: Get-Content file | supabase db query --linked
-- ============================================

-- ---------- ATTENDANCE ----------
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own attendance" ON public.attendance;
CREATE POLICY "Users read own attendance" ON public.attendance
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own attendance" ON public.attendance;
CREATE POLICY "Users insert own attendance" ON public.attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all attendance" ON public.attendance;
CREATE POLICY "Admins read all attendance" ON public.attendance
  FOR SELECT USING (public.is_admin());

-- ---------- GEOFENCE ----------
ALTER TABLE public.geofence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users read active geofence" ON public.geofence;
CREATE POLICY "All users read active geofence" ON public.geofence
  FOR SELECT USING (true);

-- ---------- AUDIT_LOG ----------
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- Insert audit log dilakukan via service role (API routes) yang bypass RLS
-- Jadi tidak perlu policy INSERT untuk anon/user

-- ---------- SETTINGS ----------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users read settings" ON public.settings;
CREATE POLICY "All users read settings" ON public.settings
  FOR SELECT USING (true);
