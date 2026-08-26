# PROJECT.md — Presensia

## Overview

Sistem absensi online berbasis GPS & selfie untuk karyawan Presensia. Karyawan melakukan check-in/out melalui browser mobile dengan validasi lokasi (geofence) dan foto selfie. Admin/Owner dapat melihat dashboard real-time, rekap bulanan, dan mengelola karyawan.

## Goals

- Absensi hanya bisa dilakukan dari lokasi yang ditentukan (geofence)
- Setiap check-in/out harus menyertakan foto selfie sebagai bukti
- Data GPS tersimpan lengkap (latitude, longitude, akurasi)
- Dashboard admin untuk monitoring semua karyawan
- Rekap bulanan otomatis
- Audit log setiap aktivitas
- **Foto auto-delete setiap 3 hari** untuk menghemat storage
- **Mobile-first** — dirancang untuk diakses dari HP

## Tech Stack

| Layer | Technology | Alasan |
|-------|------------|--------|
| Frontend | Next.js 14 (App Router) | React, SSR, mobile-friendly, deploy gratis |
| UI | Tailwind CSS + custom components | Cepat, responsive, gratis |
| Backend | Next.js API Routes | Satu codebase, serverless |
| Database | Supabase (PostgreSQL) | Free tier generos, auth built-in |
| Auth | Supabase Auth | Gratis, JWT-based, role-based |
| Storage | Cloudinary | 25 credits/bulan, image optimization, CDN |
| Hosting | Vercel | Gratis, auto-deploy dari GitHub |
| Camera | browser-native (getUserMedia) | Tanpa library tambahan |
| GPS | Browser Geolocation API | Tanpa library tambahan |

## Free Tier Limits

| Service | Free Limit | Cukup untuk |
|---------|-----------|-------------|
| Supabase DB | 500MB | ~100k+ records absensi |
| Supabase Auth | 50,000 MAU | Sangat cukup |
| Cloudinary | 25 credits/bulan | ~8 credits/bulan (25 karyawan) |
| Vercel | 100GB bandwidth | Cukup untuk web app |

## Arsitektur Sistem

```
┌─────────────────┐
│   Mobile/HP     │
│   Browser       │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Vercel        │────▶│   Cloudinary     │
│   (Next.js)     │     │   (Foto Selfie)  │
└────────┬────────┘     │   + CDN + Optimize│
         │              └──────────────────┘
         ▼
┌─────────────────┐
│   Supabase      │
│   PostgreSQL    │
│   + Auth        │
└─────────────────┘
```

## Fitur Lengkap

### Karyawan
1. Login (email + password)
2. Check-in (selfie + GPS + validasi geofence)
3. Check-out (selfie + GPS)
4. Lihat riwayat absensi hari ini
5. Lihat rekap bulanan

### Admin/Owner
1. Dashboard real-time (siapa sudah check-in)
2. Lihat foto selfie karyawan
3. Lihat lokasi GPS di peta
4. Rekap absensi harian & bulanan
5. Kelola karyawan (CRUD)
6. Atur geofence lokasi kerja
7. Audit log semua aktivitas

### Sistem
1. Auto-delete foto setiap 3 hari (cron job)
2. Validasi geofence (rumus haversine)
3. Rate limiting untuk keamanan
4. HTTPS wajib untuk kamera & GPS
