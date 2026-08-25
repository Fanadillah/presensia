-- ============================================
-- RLS Policies untuk tabel users
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- ============================================

-- 1. Pastikan RLS aktif di tabel users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama kalau ada (aman dijalankan berulang kali)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 3. SELECT: user hanya bisa baca profile sendiri
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 4. INSERT: user hanya bisa insert profile dengan id = auth.uid()
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. UPDATE: user hanya bisa update profile sendiri
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================
-- (Opsional) Policy untuk tabel lain agar admin bisa baca semua
-- Hanya jalankan kalau kamu butuh dashboard/admin melihat semua user
-- ============================================

-- Admin bisa baca semua users (pakai kolom role di tabel users)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'owner'))
  );
