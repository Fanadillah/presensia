# SCHEMA.md — Database Schema (PostgreSQL via Supabase)

## Overview

Database PostgreSQL dihost di Supabase. Semua tabel menggunakan UUID sebagai primary key, timestamps otomatis, dan soft delete untuk data penting.

## Tabel

### 1. `users` — Data Karyawan & Admin

```sql
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
```

### 2. `attendance` — Data Absensi

```sql
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
```

### 3. `geofence` — Lokasi yang Diizinkan

```sql
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
```

### 4. `work_schedule` — Jam Kerja

```sql
CREATE TABLE work_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  check_in_start TIME NOT NULL DEFAULT '08:00',
  check_in_end TIME NOT NULL DEFAULT '09:00',
  check_out_start TIME NOT NULL DEFAULT '17:00',
  check_out_end TIME NOT NULL DEFAULT '18:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. `audit_log` — Log Aktivitas

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. `settings` — Pengaturan Sistem

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_recorded_at ON attendance(recorded_at);
CREATE INDEX idx_attendance_type ON attendance(type);
CREATE INDEX idx_attendance_date ON attendance((recorded_at::date));
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

## Views

### View Rekap Harian

```sql
CREATE VIEW daily_recap AS
SELECT
  u.id as user_id,
  u.full_name,
  a.check_in_time,
  a.check_out_time,
  a.check_in_photo,
  a.check_out_photo,
  a.check_in_location,
  a.check_out_location,
  a.is_late,
  a.work_hours
FROM (
  SELECT
    user_id,
    MAX(CASE WHEN type = 'check_in' THEN recorded_at END) as check_in_time,
    MAX(CASE WHEN type = 'check_out' THEN recorded_at END) as check_out_time,
    MAX(CASE WHEN type = 'check_in' THEN photo_url END) as check_in_photo,
    MAX(CASE WHEN type = 'check_out' THEN photo_url END) as check_out_photo,
    MAX(CASE WHEN type = 'check_in' THEN POINT(longitude, latitude) END) as check_in_location,
    MAX(CASE WHEN type = 'check_out' THEN POINT(longitude, latitude) END) as check_out_location,
    BOOL_OR(CASE WHEN type = 'check_in' THEN is_within_geofence END) as is_late,
    EXTRACT(EPOCH FROM (
      MAX(CASE WHEN type = 'check_out' THEN recorded_at END) -
      MAX(CASE WHEN type = 'check_in' THEN recorded_at END)
    )) / 3600.0 as work_hours
  FROM attendance
  WHERE recorded_at::date = CURRENT_DATE
  GROUP BY user_id
) a
JOIN users u ON u.id = a.user_id
WHERE u.is_active = true;
```

## Foreign Key Relations

```
users.id ──────────▶ attendance.user_id
users.id ──────────▶ audit_log.user_id
geofence.id ───────▶ attendance.geofence_id
```

## Settings Default

```sql
INSERT INTO settings (key, value, description) VALUES
('geofence_radius', '100', 'Radius geofence dalam meter'),
('check_in_start', '08:00', 'Jam mulai absen masuk'),
('check_in_end', '09:00', 'Jam akhir absen masuk'),
('check_out_start', '17:00', 'Jam mulai absen pulang'),
('check_out_end', '18:00', 'Jam akhir absen pulang'),
('late_threshold_minutes', '15', 'Batas toleransi keterlambatan (menit)'),
('photo_retention_days', '3', 'Hari penyimpanan foto sebelum auto-delete');
```

## Auto-Delete Foto (Cron Job)

Foto akan dihapus otomatis setiap 3 hari. Implementation:

1. Setiap foto yang diupload punya timestamp
2. Cron job berjalan setiap midnight
3. Hapus foto dari Cloudinary yang lebih dari 3 hari
4. Set `photo_url` di tabel attendance menjadi `NULL`
5. Log penghapusan di audit_log
