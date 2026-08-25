# 📋 Rencana Redesain & Pengembangan — Presensia

> Dibuat: 23 Agustus 2026
> Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase · Cloudinary

## Ringkasan

Redesain total tampilan dengan arah **modern dashboard SaaS** (sidebar gelap, card bersih,
warna brand konsisten, font Plus Jakarta Sans) + dark mode, perbaikan seluruh bug yang
ditemukan, dan penambahan fitur HR standar untuk aplikasi absensi.

---

## Fase 0 — Design System

- [ ] Theme tokens Tailwind v4 (`@theme` di `globals.css`): warna brand biru, warna semantik
      (primary/success/warning/danger), radius, shadow
- [ ] Font **Plus Jakarta Sans** via `next/font` (ganti system font)
- [ ] UI primitives baru di `src/components/ui/`: Button, Input, Select, Badge, Card, Table,
      Skeleton, Pagination, Tabs, Avatar — memanfaatkan `cva` + `cn()` (sudah terinstall)
- [ ] **Dark mode** class strategy + toggle (persist localStorage)
- [ ] Toast provider global di root layout (hapus wrap manual per halaman)

## Fase 1 — Shell Layout & Perbaikan Bug

- [ ] Satu `layout.tsx` bersama untuk semua halaman terproteksi
      (hapus duplikasi Sidebar/MobileNav/AuthGuard inline di page.tsx, history, profile)
- [ ] Fix bug:
  - Jam realtime berjalan (saat ini statis, dihitung sekali saat render)
  - MobileNav admin kehilangan menu geofence/audit/settings → drawer mobile lengkap
  - Konfirmasi sebelum logout
  - `alert()` di settings → toast
  - Cek error semua query Supabase (banyak yang diam-diam diabaikan)
  - N+1 query di halaman employees
  - Label "Di Luar Geofence" ≠ "Terlambat" dibedakan
  - Aksesibilitas: aktifkan zoom (`userScalable`), icon PWA hilang di `public/`

## Fase 2 — Home Karyawan Baru ⭐

Semua section:

1. **Hero**: sapaan dinamis ("Selamat Pagi/Siang/Sore/Malam, [Nama]") + foto profil +
   tanggal lengkap + jam realtime
2. **Card status absensi** hari ini + tombol besar "Absen Sekarang" / "Check Out"
3. **Statistik pribadi bulan ini**: hadir X hari · terlambat Y kali · izin Z hari
4. **Kalender mini** bulan ini dengan titik warna per tanggal
5. **Info kantor/geofence** terdekat + jarak real-time dari posisi user
6. **Pengumuman** (list card) — lihat Fase 5
7. **Riwayat singkat** 3 hari terakhir

## Fase 3 — Halaman Check In/Out + Peta ⭐

- Kamera selfie (komponen existing dipakai ulang)
- **Peta interaktif Leaflet + OpenStreetMap** (gratis, tanpa API key):
  - Titik kantor/geofence terdekat + lingkaran radius
  - Marker posisi user + akurasi GPS
  - Indikator hijau "Anda di dalam area kantor" / merah "Di luar jangkauan — X meter"
- Keputusan **opsi (a)**: di luar radius tetap bisa absen, dicatat flag
  `is_within_geofence = false`
- Komponen peta dibuat reusable (dipakai lagi di Geofence admin)

## Fase 4 — Core Absensi (Jam Kerja & Terlambat)

- Aktifkan `WORK_SCHEDULE` (08:00–09:00): deteksi **terlambat otomatis server-side**
  saat check-in → kolom baru `is_late`
- Hitung **durasi kerja** saat check-out → kolom baru `work_duration_minutes`
- Halaman Attendance admin baru: filter rentang tanggal + pencarian nama + filter
  tipe/status, pagination, nama geofence (bukan koordinat mentah), badge status

## Fase 5 — Fitur Pengumuman (baru)

- Tabel baru `announcements` (id, title, body, created_by, is_active, created_at)
  + migration SQL + RLS policies
- Admin: CRUD pengumuman (tambah/edit/hapus/toggle aktif)
- Karyawan: read-only, tampil di section Home

## Fase 6 — Riwayat & Kalender Karyawan

- Kalender kehadiran bulanan interaktif (hijau=hadir, kuning=terlambat, merah=tidak hadir,
  biru=cuti/izin)
- Rekap bulanan: total hadir, terlambat, durasi rata-rata
- Foto absensi bisa diklik untuk diperbesar (modal viewer)

## Fase 7 — CRUD Karyawan & Geofence

- **Karyawan**: tambah akun (email+password via auth admin), edit nama/telepon/role,
  aktifkan/nonaktifkan, reset password, search + pagination
- **Geofence**: tambah/edit/hapus/toggle dari UI + **peta interaktif**
  (pilih lokasi klik peta + lingkaran radius visual)

## Fase 8 — Dashboard Admin & Profil

- Stat card dengan tren/persentase
- Chart **Recharts**: tren check-in mingguan, grafik keterlambatan
- Daftar belum absen hari ini + aksi cepat
- Profil: edit nama/telepon/foto + statistik personal + ganti password

## Fase 9 — Cuti / Izin / Sakit

- Tabel baru `leave_requests` (id, user_id, type, start_date, end_date, reason,
  status pending/approved/rejected, reviewed_by) + migration SQL + RLS
- Form pengajuan karyawan
- Halaman approval admin
- Integrasi ke kalender, rekap bulanan, dan dashboard (hari cuti ≠ tidak hadir)

## Fase 10 — Export Data

- Export **CSV** client-side untuk attendance admin & riwayat karyawan
  (mengikuti filter aktif)
- Export **PDF** via print-friendly view

---

## Migration SQL (file baru)

- Tabel `announcements` + RLS
- Tabel `leave_requests` + RLS
- Kolom `attendance`: `is_late boolean default false`, `work_duration_minutes integer`

## Library Baru

| Library | Fungsi |
|---|---|
| `recharts` | Grafik/statistik dashboard |
| `leaflet` + `react-leaflet` | Peta interaktif (OSM, tanpa API key) |
| `date-fns` | Utilitas tanggal (rekap bulanan, kalender) |

## Akun Test

Lihat `DAFTAR_AKUN.md` (password default: `Rolis2026!`)
