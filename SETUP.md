# SETUP.md — Setup Guide (Step-by-Step)

Panduan lengkap setup Presensia dari nol.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Setup Supabase](#3-setup-supabase)
4. [Setup Cloudflare R2](#4-setup-cloudflare-r2)
5. [Configure Environment](#5-configure-environment)
6. [Run Development Server](#6-run-development-server)
7. [Create Admin User](#7-create-admin-user)
8. [Setup Geofence](#8-setup-geofence)
9. [Test the App](#9-test-the-app)
10. [Deploy to Production](#10-deploy-to-production)

---

## 1. Prerequisites

Pastikan sudah terinstall:

- [ ] **Node.js 18+** — Download: https://nodejs.org
- [ ] **npm 9+** (sudah include dengan Node.js)
- [ ] **Git** — Download: https://git-scm.com
- [ ] **Akun GitHub** — Untuk version control & deploy
- [ ] **Akun Supabase** — https://supabase.com (gratis)
- [ ] **Akun Cloudflare** — https://cloudflare.com (gratis)

### Cek Installation

```bash
node --version   # v18.0.0 atau lebih tinggi
npm --version    # 9.0.0 atau lebih tinggi
git --version    # 2.0.0 atau lebih tinggi
```

---

## 2. Clone & Install

```bash
# Clone repository
git clone https://github.com/username/presensia.git

# Masuk ke folder
cd presensia

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

---

## 3. Setup Supabase

### 3.1 Buat Project

1. Buka https://supabase.com/dashboard
2. Klik **"New Project"**
3. Isi form:
   - **Organization**: Pilih atau buat baru
   - **Name**: `presensia`
   - **Database Password**: Buat password yang kuat (**SIMPAN!**)
   - **Region**: `Southeast Asia (Singapore)`
4. Klik **"Create new project"**
5. Tunggu ~2 menit

### 3.2 Setup Database

1. Di Supabase Dashboard, klik **"SQL Editor"** (menu kiri)
2. Klik **"New query"**
3. Copy-paste SQL berikut:

```sql
-- Buat tabel users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'karyawan' CHECK (role IN ('karyawan', 'admin', 'owner')),
  phone VARCHAR(20),
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Buat tabel geofence
CREATE TABLE geofence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Buat tabel attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('check_in', 'check_out')),
  photo_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  is_within_geofence BOOLEAN,
  geofence_id UUID REFERENCES geofence(id),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Buat tabel audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Buat tabel settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('geofence_radius', '100', 'Radius geofence dalam meter'),
('check_in_start', '08:00', 'Jam mulai absen masuk'),
('check_in_end', '09:00', 'Jam akhir absen masuk'),
('check_out_start', '17:00', 'Jam mulai absen pulang'),
('check_out_end', '18:00', 'Jam akhir absen pulang'),
('late_threshold_minutes', '15', 'Batas toleransi keterlambatan'),
('photo_retention_days', '3', 'Hari penyimpanan foto');

-- Buat indexes
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_recorded_at ON attendance(recorded_at);
CREATE INDEX idx_attendance_type ON attendance(type);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_users_email ON users(email);
```

4. Klik **"Run"** untuk menjalankan

### 3.3 Ambil API Keys

1. Klik **"Settings"** (ikon gear) → **"API"**
2. Copy values berikut:

```
Project URL: https://xxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **PENTING**: Jangan share `service_role key` ke publik!

---

## 4. Setup Cloudinary (untuk penyimpanan foto)

### 4.1 Buat Akun Cloudinary

1. Buka https://cloudinary.com
2. Klik **"Sign Up For Free"**
3. Daftar dengan email atau GitHub/Google
4. Verifikasi email jika perlu

### 4.2 Ambil Credentials

Setelah login, buka **Dashboard** → **Settings** → **API Keys** (atau kunjungi langsung):

```
Cloud Name:  xxxxxxxxx        (di halaman utama dashboard)
API Key:     xxxxxxxxx        (di Settings → API Keys)
API Secret:  xxxxxxxxxxxxxxxx (klik "Reveal" lalu copy)
```

> **PENTING**: API Secret hanya ditampilkan sekali. Simpan segera!

### 4.3 Setup Upload Preset (opsional, untuk optimasi)

1. Buka **Settings** → **Upload**
2. Di bagian **Upload presets**, klik **"Add upload preset"**
3. Isi:
   - **Preset name**: `absensi-presets`
   - **Signing Mode**: `Unsigned` (untuk client-side upload)
   - **Folder**: `attendance`
4. Klik **Save**

### 4.4 Catat Values

```
Cloud Name: xxxxxxxxx
API Key: xxxxxxxxx
API Secret: xxxxxxxxxxxxxxxx
```

> **Tips**: Cloudinary free tier memberikan 25 credits/bulan.
> 1 credit = 1GB storage ATAU 1GB bandwidth ATAU 1000 transformations.
> Untuk 25 karyawan, estimasi pemakaian ~8 credits/bulan (masih aman).

---

## 5. Configure Environment

Edit file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (paste dari Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (paste dari Supabase)

# Cloudflare R2
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=buat_random_string_sendiri
PHOTO_RETENTION_DAYS=3
```

---

## 6. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000 di browser.

---

## 7. Create Admin User

### Option A: Via Supabase Dashboard

1. Buka Supabase Dashboard → **"Authentication"** → **"Users"**
2. Klik **"Invite user"**
3. Isi email & password
4. Setelah user terbuat, update role di SQL Editor:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Option B: Via App (jika ada halaman register)

Buat akun baru melalui halaman register, lalu update role via SQL.

---

## 8. Setup Geofence

Insert lokasi kerja ke database:

```sql
-- Contoh: Kantor Pusat Presensia
INSERT INTO geofence (name, latitude, longitude, radius_meters) VALUES
('Presensia - Utama', -6.2088, 106.8456, 100);
```

> **Cara dapat koordinat**: Buka Google Maps → Klik lokasi → Copy latitude & longitude

---

## 9. Test the App

### Test Login
1. Buka http://localhost:3000/login
2. Login dengan akun yang sudah dibuat
3. Pastikan redirect ke halaman yang benar

### Test Check-In
1. Login sebagai karyawan
2. Klik tombol "CHECK IN"
3. Izinkan akses kamera & GPS
4. Ambil foto selfie
5. Pastikan GPS terbaca
6. Submit
7. Pastikan data masuk ke database

### Test Admin Dashboard
1. Login sebagai admin
2. Buka http://localhost:3000/dashboard
3. Pastikan statistik muncul

---

## 10. Deploy to Production

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap deploy ke:
- Vercel (hosting)
- Supabase (database production)
- Cloudflare R2 (storage production)

---

## Troubleshooting

### Kamera tidak jalan
- Pastikan akses HTTPS (production) atau localhost (development)
- Cek izin kamera di browser settings

### GPS tidak akurat
- Pastikan izin lokasi diberikan
- GPS lebih akurat di luar ruangan

### Upload foto gagal
- Cek ukuran file (maks 5MB)
- Cek koneksi internet
- Cek environment variables R2

### Database error
- Pastikan SQL schema sudah di-run
- Cek koneksi ke Supabase