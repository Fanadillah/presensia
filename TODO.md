# TODO.md — Feature Checklist

## Status Legend

- [ ] Belum dikerjakan
- [~] Sedang dikerjakan
- [x] Selesai

---

## Phase 1: Setup & Foundation

- [x] Buat dokumentasi lengkap (12 file .md)
- [x] Setup Next.js project (Next 16.3.2 App Router, webpack)
- [x] Install dependencies (supabase, cloudinary, leaflet, recharts, sharp, etc.)
- [x] Setup Tailwind CSS (v4 + @tailwindcss/postcss)
- [x] Setup shadcn/ui (custom ui/* components: Button, Card, Badge, Table, etc.)
- [x] Setup Supabase client (src/lib/supabase/client + server + ssr)
- [x] Setup Cloudinary client (src/lib/cloudinary.ts — uploadPhoto, deletePhoto, deletePhotosByFolder)
- [x] Buat TypeScript types (src/types/index.ts)

---

## Phase 2: Database & Auth

- [x] Buat database schema di Supabase (supabase/migrations/*, 5 migrasi)
- [x] Setup Supabase Auth (email+password, ensure-profile)
- [x] Buat auth middleware (src/proxy.ts + AuthGuard/OwnerGuard + RBAC)
- [x] Buat login page (src/app/login/page.tsx)
- [x] Buat logout functionality (api/auth/logout + useAuth.logout)
- [x] Handle session management (proxy + supabase ssr cookies)
- [x] Role-based access control (src/lib/rbac.ts, proxy admin/owner guard, AppShell adminOnly)

---

## Phase 3: Attendance Core

- [x] Buat komponen CameraCapture (src/components/attendance/CameraCapture.tsx)
- [x] Implement selfie camera (getUserMedia)
- [x] Implement GPS capture (Geolocation API — src/hooks/useGeolocation)
- [x] Buat fungsi geofence validation (haversine — src/lib/geofence.ts)
- [x] Buat API check-in (api/attendance/check-in, watermark + Cloudinary + geofence)
- [x] Buat API check-out (api/attendance/check-out, work_duration_minutes)
- [x] Upload foto ke Cloudinary (compressed 720p q70 mozjpeg + watermark)
- [x] Buat halaman home karyawan (src/app/(main)/page.tsx: Hero, TodayStatus, MonthlyStats)
- [x] Tampilkan status hari ini (TodayStatusCard + useAttendance)

---

## Phase 4: Admin Dashboard

- [x] Buat layout admin (sidebar) (src/components/layout/*, AppShell)
- [x] Buat dashboard stats component (src/app/(admin)/dashboard/page.tsx: 5 cards + 7-hari chart)
- [x] Buat API dashboard data (via supabase queries di dashboard page — aggregated)
- [x] Buat employee list table (src/app/(admin)/employees/page.tsx)
- [x] Buat API CRUD employees (api/employees + [id], hierarki owner>admin>karyawan)
- [x] Buat attendance table (admin view) (src/app/(admin)/attendance/page.tsx + filter + pagination)
- [x] Buat photo viewer modal (Modal + foto selfie)
- [x] Buat rekap bulanan table (attendance page export CSV + payroll page)
- [x] Buat audit log table (src/app/(admin)/audit/page.tsx)

---

## Phase 5: Geofence & Settings

- [x] Buat halaman geofence management (src/app/(admin)/geofence/page.tsx, MapPicker, radius 10-10000m)
- [x] Buat API CRUD geofence (supabase geofence table, is_active toggle)
- [x] Buat halaman settings (src/app/(owner)/settings/page.tsx)
- [x] Buat API update settings (supabase settings table)

---

## Phase 6: Auto-Delete Photos

- [x] Implement cron job endpoint (api/cron/delete-photos — Plan B: photo_public_id presisi)
- [x] Fetch photos older than 3 days (batch 200, recorded_at < cutoff)
- [x] Delete from Cloudinary (deletePhoto per public_id + legacy deletePhotosByFolder fallback)
- [x] Update database (set photo_url = NULL, photo_public_id = NULL)
- [x] Log deletion to audit_log (details: destroyed_by_public_id, db_nulled, retention_days)
- [x] Setup Vercel cron schedule (vercel.json: 0 0 * * * daily, PHOTO_RETENTION_DAYS=3)

> Migrasi `20260824000000_photo_public_id.sql` perlu dijalankan sekali di Supabase SQL Editor (ALTER TABLE attendance ADD COLUMN photo_public_id).

---

## Phase 7: Mobile Optimization

- [x] Responsive layout untuk semua halaman (grid, AppShell, Topbar)
- [x] Bottom navigation untuk mobile (src/components/layout/MobileNav.tsx)
- [x] Touch-friendly buttons (44x44px) (Button size xl, min-h 44px)
- [x] Camera fallback untuk browser lama (CameraCapture error handling)
- [x] GPS error handling untuk mobile (useGeolocation error + refresh)
- [x] PWA manifest (public/manifest.json + icons 192/512 maskable)

---

## Phase 8: Polish & Testing

- [x] Unit tests untuk geofence (src/lib/geofence.test.ts — 8 tests, haversine + isWithin)
- [x] Unit tests untuk camera utils (src/lib/attendance.test.ts — isLateCheckIn/formatWorkDuration, src/lib/watermark.test.ts — sharp watermark + fallback, src/lib/rbac.test.ts — canManage/maxAssignableRole)
- [x] Integration tests untuk API (src/app/api/attendance/integration.test.ts — check-in flow, RBAC downgrade, cron cutoff — 27 tests total via vitest)
- [x] E2E tests untuk login flow (e2e/login.spec.ts — render + validasi + login gagal, playwright chromium)
- [x] E2E tests untuk check-in flow (e2e/checkin.spec.ts — redirect /login, mock geolocation, alur manual skip)
- [x] Error handling di semua halaman (try/catch + toast + EmptyState)
- [x] Loading states (SkeletonCard, SkeletonList, SkeletonTable, PageLoader)
- [x] Empty states (EmptyState component)
- [x] Success/error toasts (src/components/shared/Toast)

---

## Phase 9: Deployment

- [x] Setup Supabase production (https://jdhrsqzblmucvggxygxy.supabase.co, 4 users seeded)
- [x] Setup Cloudinary production (dqzr8je0e)
- [ ] Deploy ke Vercel
- [ ] Setup custom domain
- [ ] Setup HTTPS (auto via Vercel)
- [x] Setup environment variables (.env.local + vercel.json cron)
- [x] Setup cron job (vercel.json)
- [x] Create admin user (DAFTAR_AKUN.md: admin@contoh.com, admin@example.com)
- [x] Setup geofence (via UI /geofence)
- [ ] Test production deployment

---

## Future Enhancements (Backlog)

- [x] Export data ke Excel/CSV (attendance/page.tsx: exportCsv ; separator ;)
- [ ] Notifikasi push (web push)
- [ ] Multi-bahasa (ID/EN)
- [ ] Dark mode
- [ ] Face recognition (anti-fraud)
- [ ] Offline mode dengan sync
- [x] Dashboard grafik (chart) (recharts BarChart 7 hari)
- [x] Laporan PDF (attendance/page.tsx: window.print)
- [ ] Integration dengan sistem HR lain
