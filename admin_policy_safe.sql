-- Function untuk cek apakah current user adalah admin/owner
-- Pakai SECURITY DEFINER agar tidak kena RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
  );
$$;

-- Policy agar admin bisa baca semua users (pakai function is_admin)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (public.is_admin());
