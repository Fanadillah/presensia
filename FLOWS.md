# FLOWS.md — User Flow & Business Logic

## 1. Flow Login

```
┌──────────────┐
│  Buka App    │
└──────┬───────┘
       ▼
┌──────────────┐     Tidak    ┌──────────────────┐
│  Sudah login?├────────────▶│  Tampilkan Login  │
└──────┬───────┘             └────────┬─────────┘
       │ Ya                           │
       ▼                              ▼
┌──────────────┐             ┌──────────────────┐
│  Redirect ke │             │  Input Email &   │
│  Dashboard   │             │  Password        │
└──────────────┘             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  Validasi ke     │
                             │  Supabase Auth   │
                             └────────┬─────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                         Sukses                 Gagal
                          │                       │
                          ▼                       ▼
                 ┌────────────────┐      ┌────────────────┐
                 │ Simpan session │      │ Tampilkan error│
                 │ Redirect based │      │ "Email/Password│
                 │ on role        │      │  salah"        │
                 └────────────────┘      └────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         role=karyawan           role=admin/owner
              │                       │
              ▼                       ▼
     ┌────────────────┐      ┌────────────────┐
     │ Halaman Home   │      │ Dashboard Admin│
     │ (Check-in/out) │      │                │
     └────────────────┘      └────────────────┘
```

## 2. Flow Check-In Karyawan

```
┌──────────────────┐
│  Klik CHECK IN   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Minta Izin      │
│  Kamera & GPS    │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
  Ditolak   Disetujui
    │         │
    ▼         ▼
┌────────┐ ┌──────────────────┐
│ Error: │ │  Aktifkan kamera │
│ Izin   │ │  depan (selfie)  │
│ kamera │ │  + Ambil GPS     │
└────────┘ └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  User ambil foto │
           │  selfie          │
           └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  Preview foto    │
           │  [Retake] [OK]   │
           └────────┬─────────┘
                    │ OK
                    ▼
           ┌──────────────────┐
           │  Kirim ke API:   │
           │  - foto (base64) │
           │  - latitude      │
           │  - longitude     │
           │  - accuracy      │
           └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  Upload foto ke  │
           │  Cloudinary   │
           └────────┬─────────┘
                    ▼
           ┌──────────────────┐
           │  Validasi GPS:   │
           │  Haversine       │
           │  vs Geofence     │
           └────────┬─────────┘
                    │
           ┌────────┴────────┐
           │                 │
     Dalam Radius    Di Luar Radius
           │                 │
           ▼                 ▼
  ┌────────────────┐ ┌────────────────┐
  │ Simpan ke DB   │ │ Tampilkan      │
  │ is_within=true │ │ warning:       │
  │ Audit log      │ │ "Di luar       │
  │ Toast sukses   │ │  area kerja!"  │
  └────────────────┘ │ Tetap simpan   │
                     │ is_within=false│
                     └────────────────┘
```

## 3. Flow Check-Out Karyawan

```
Sama seperti Check-In, tapi:
- Type = "check_out"
- Tidak wajib dalam geofence (boleh dari mana saja)
- Simpan timestamp check_out
```

## 4. Flow Geofence Validation (Haversine Formula)

```
Input:
  - user_lat, user_lon (dari GPS user)
  - geofence_lat, geofence_lon (dari database)
  - geofence_radius (dari database, dalam meter)

Rumus Haversine:
  a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
  c = 2 * atan2(√a, √(1-a))
  distance = R * c

  R = 6371000 meter (radius bumi)

Output:
  - distance <= radius → VALID (dalam geofence)
  - distance > radius → INVALID (di luar geofence)
```

## 5. Flow Auto-Delete Foto (Cron Job)

```
┌──────────────────────────┐
│  Cron: Setiap midnight   │
│  (00:00 WIB)             │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Query: SELECT all       │
│  attendance with photo   │
│  where recorded_at <     │
│  NOW() - INTERVAL '3 day'│
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Untuk setiap record:    │
│  1. Hapus file dari Cloudinary   │
│  2. Set photo_url = NULL │
│  3. Log ke audit_log     │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Summary:                │
│  - X foto dihapus        │
│  - Y storage freed       │
└──────────────────────────┘
```

## 6. Flow Admin Dashboard

```
┌──────────────────────────┐
│  Admin Login             │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  GET /api/admin/dashboard│
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Tampilkan:              │
│  ┌────────────────────┐  │
│  │ Total Karyawan: 25 │  │
│  │ Sudah Check-in: 20 │  │
│  │ Belum: 5           │  │
│  │ Terlambat: 3       │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Recent Attendance  │  │
│  │ - Budi: 08:30 ✓    │  │
│  │ - Andi: 08:45 ✓    │  │
│  │ - Eka: 09:15 ⚠️    │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ [Lihat Foto]       │  │
│  │ Klik → modal opens │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

## 7. Business Rules

### Jam Kerja Default
- **Jam Masuk**: 08:00 - 09:00
- **Jam Pulang**: 17:00 - 18:00
- **Toleransi Keterlambatan**: 15 menit setelah jam 08:00

### Keterlambatan
- Check-in setelah 08:15 = Terlambat
- Ditandai di dashboard dengan warna kuning/merah

### Geofence
- Default radius: 100 meter dari titik pusat
- Bisa diatur di halaman settings
- Multiple geofence didukung

### Foto
- Format: JPEG atau PNG
- Maksimal ukuran: 5MB
- **Auto-delete setelah 3 hari**
- Tersimpan di Cloudinary

### Absensi
- Karyawan HANYA bisa check-in 1x per hari
- Check-out HANYA bisa dilakukan setelah check-in
- Check-in/out diluar jam kerja tetap dicatat (tapi ditandai)

### Role-Based Access
- **Karyawan**: Check-in/out, lihat riwayat sendiri
- **Admin**: Lihat semua karyawan, rekap, audit log
- **Owner**: Semua hak admin + kelola settings + kelola admin lain

## 8. Error Handling Flow

```
┌──────────────────────────┐
│  Error terjadi           │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Tampilkan Toast/Error   │
│  yang user-friendly      │
│                          │
│  Contoh:                 │
│  - "GPS tidak aktif"     │
│  - "Di luar area kerja"  │
│  - "Foto terlalu besar"  │
│  - "Session expired"     │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Log error ke audit_log  │
│  (untuk debugging admin) │
└──────────────────────────┘
```
