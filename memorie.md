# memorie.md — Presensia Session Memory

> Ringkasan semua yang dikerjakan 27 Aug 2026 agar bisa lanjut di session berikutnya. Build mode active saat ini.

## Project
- **App:** `sistem absensi gps dan foto/app` — Next.js 16.3.2, Tailwind v4, Supabase `https://jdhrsqzblmucvggxygxy.supabase.co`, Cloudinary `dqzr8je0e`, Vercel `presensia` `https://app-puce-five-45.vercel.app` (alias utama), deploy `presensia-b48vcgluq`, `presensia-gy8wp9e1q`, `presensia-2n3dyqyyb`, `presensia-6b1rm09mz`, `presensia-lkipnrk8f` etc. `vercel project ls` project `presensia`.
- **Repo:** `https://github.com/Fanadillah/presensia.git` branch `main`
- **Domain custom:** `ilhamcode.com` (530d, Third Party, `visitor-notif-app` `A 76.76.21.21` not configured, `nslookup Non-existent domain` — expired/tidak resolve 27 Aug). Dipakai untuk Opsi A custom domain tapi belum fix DNS.

## Session 27 Aug 2026 - Kronologi & Commit

### 1. Deploy warning `situs berbahaya` silang merah
- **Penyebab:** `*.vercel.app` shared reputation + Google Safe Browsing flag `form login + Kamera GPS` dianggap phishing. Bukan SSL — `Strict-Transport-Security max-age=63072000` OK, `200 OK`. Cek `transparencyreport.google.com/safe-browsing/search`.
- **Solusi:** Opsi A custom domain `presensia.ilhamcode.com` `vercel alias set` atau Search Console Request Review. Sementara klik `Detail -> Kunjungi tetap`.
- **Status:** `ilhamcode.com` belum sambung ke apapun (`vercel domains inspect` + `alias ls` kosong).

### 2. Kamera fix — `72c5b39` `fix(camera): retake black screen + mirror selfie`
- **Bug:** `CameraCapture.tsx:44 handleRetake` hanya `resetPhoto` tanpa re-attach `stream` → video baru hitam (stream sama, effect tidak jalan). `useCamera.ts:111 stopCamera` stale closure.
- **Fix:** `useCamera.ts:58,97` `ctx.translate(cw,0); ctx.scale(-1,1)` mirror canvas, `stopCamera/resetPhoto` functional `setState(prev=>)`, `CameraCapture.tsx:44 requestAnimationFrame re-attach + useEffect captured watcher`, `video [transform:scaleX(-1)]` preview & img. `tsc:0`.

### 3. Role absen — `2d3f03d` `feat: owner tanpa absen/history/cuti + admin beranda sama`
- **Keputusan:** Karyawan+Admin bisa absen, Owner tidak. Owner keep `leaves` approve.
- **File:** `menu.ts:49` hapus `/absen` dari `ownerMenu`, `proxy.ts:61` block `ownerBlockedPrefixes [/absen,/history,/leave] -> /dashboard`, `check-in/out route.ts:11` `403 Owner tidak perlu absen`, `AdminQuickCard.tsx:1` new + ` (main)/page.tsx:24` inject jika `admin`.

### 4. Hero & Dashboard — `7e0c7be` `fix: hero stay side-by-side + dashboard redesign`
- **Hero `Hero.tsx:31`:** `flex-wrap` -> `flex items-center justify-between gap-3` + `min-w-0 truncate` kiri, `shrink-0 h-14 sm:h-20` kanan, tanggal `hidden sm:block` vs `xs`.
- **Dashboard `dashboard/page.tsx:147`:** Hapus `Absen Sekarang` button, stat `flex items-center gap-3` horizontal (next iterasi 4 cols).

### 5. Jam dinamis Plan C — `a67ef6c` `feat: Plan C jam dinamis + shift-ready`
- **Need:** Karyawan lihat `Jam 08:00 • Telat >08:15` sebelum absen, sebelumnya hardcode `constants.ts:30 WORK_SCHEDULE`.
- **Implement:** `schedule.ts:1` new `WorkSchedule`, `parseSettingsToSchedule`, `getWorkScheduleForUser` shift-ready fallback global, `lateLabel`, `constants.ts:30 DEFAULT_WORK_SCHEDULE`, `attendance.ts:9 lateThresholdMinutes(schedule)`, `check-in/route.ts:104 schedule fetch`, `TodayStatusCard.tsx:63` badge `Clock3 {checkInStart} • Telat >{lateLabel}` fetch `settings`.
- **Backlog:** `TODO.md:140 Fase 10 Shift Fleksibel` owner bikin bebas, per orang/divisi, rotasi manual mingguan, `divisions/shifts/shift_assignments` schema, `use_shift_mode=false`.

### 6. Help per role — `1552e0f` `feat(help): panduan per role`
- `menu.ts:10 HelpCircle` ke semua role, `app/help/page.tsx:1` 12 section role-aware tabs `karyawan/admin/owner`, langkah per fitur, `29/29 pages` build.

### 7. Watermark kotak-kotak — `d75885a` `fix(watermark): kotak-kotak`
- **Penyebab:** `watermark.ts:73 sans-serif` + `±` unicode tidak ada di Vercel linux fontconfig -> tofu.
- **Fix:** `±` -> `(+/-` `watermark.ts:64`, `font-family 'DejaVu Sans','Liberation Sans',Arial` + `paint-order stroke`, `vitest 2 passed`.

### 8. Dashboard Opsi A redesign — `b67c574` `feat(dashboard): Opsi A minimal clean`
- Stat `4 cols border-l-4` `primary/success/warning/orange`, `Di Luar Area` jadi `+badge` di Terlambat, chart `p-6 h-72 legend inline radius 8 maxBar 36`, Belum Absen header `border-b` CTA `bg-primary`. User pilih Opsi A.

### 9. Surat sakit Opsi C — `8d4d369` `feat(leave): sakit opsional foto`
- **Keputusan Opsi C:** `sakit` foto opsional (kamera+galeri), hapus 3 hari (bukan wajib).
- `types:115 attachment_url/public_id`, `api/leaves/route.ts:1` POST FormData upload `leave` folder, `LeaveTab.tsx:18` dual opsi `CameraCapture` + `<input file>` preview 5MB validasi, `LeaveAdminTab.tsx:109` thumb / `Tanpa surat`, `cron/delete-photos` perluas leave, `migrations/20260827000000_leave_attachment.sql:1`, `TODO Fase 11`. Build `30/30 pages`.

### Latest Deploy
- Commit `8d4d369` -> `https://app-puce-five-45.vercel.app` `Ready 1m` `Compiled 9.9s`.
- Semua `tsc --noEmit:0`.

## File Penting
- `app/src/lib/schedule.ts:1`, `app/src/lib/attendance.ts:9`, `app/src/lib/constants.ts:30`, `app/src/lib/watermark.ts:73`, `app/src/lib/menu.ts:49`, `app/src/proxy.ts:61`, `app/src/components/home/Hero.tsx:31`, `app/src/components/home/TodayStatusCard.tsx:63`, `app/src/components/home/AdminQuickCard.tsx:1`, `app/src/app/(admin)/dashboard/page.tsx:133`, `app/src/app/help/page.tsx:1`, `app/src/app/api/leaves/route.ts:1`, `app/src/types/index.ts:115`.

## Backlog (TODO Fase 10 & 11)
- Fase 10 Shift: owner bebas, per orang/divisi, manual mingguan, `use_shift_mode`.
- Fase 11 Surat sakit sudah implement Opsi C tapi migrasi `attachment` perlu `RUN SQL` sekali di Supabase.

## Cara Lanjut Session Berikutnya
- Jalankan migrasi `supabase/migrations/20260827000000_leave_attachment.sql` di Supabase SQL Editor jika `attachment` 403.
- Untuk custom domain: perbaiki `ilhamcode.com` DNS `A 76.76.21.21` atau beli baru, `vercel alias set app-puce-five-45.vercel.app presensia.ilhamcode.com`.
- Test flow: karyawan `/absen` mirror + watermark baru, admin `/` card Kelola Tim, owner `/absen` redirect, `/help` per role, `sakit` upload.
