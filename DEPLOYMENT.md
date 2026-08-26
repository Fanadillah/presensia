# DEPLOYMENT.md — Deployment Guide

## Overview

Panduan deploy Presensia ke production menggunakan layanan gratis:
- **Supabase**: Database PostgreSQL + Auth
- **Cloudinary**: Object Storage & CDN untuk foto (25 credits free tier)
- **Vercel**: Hosting Next.js

---

## 1. Setup Supabase

### Step 1: Buat Akun Supabase
1. Buka https://supabase.com
2. Klik "Start your project" → Sign up dengan GitHub/Google
3. Buat organization baru (jika belum ada)

### Step 2: Buat Project Baru
1. Klik "New Project"
2. Pilih organization
3. Isi:
   - **Name**: `presensia`
   - **Database Password**: (simpan!)
   - **Region**: Southeast Asia (Singapore)
4. Klik "Create new project"
5. Tunggu ~2 menit hingga selesai

### Step 3: Setup Database Schema
1. Buka Supabase Dashboard → project yang baru dibuat
2. Klik **SQL Editor** (menu kiri)
3. Copy-paste isi dari `SCHEMA.md` (bagian CREATE TABLE)
4. Klik **Run** untuk menjalankan SQL

### Step 4: Ambil API Keys
1. Buka **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGci...`
   - **service_role key**: `eyJhbGci...` (jangan di-share!)

### Step 5: Setup Row Level Security (RLS)
1. Buka **Authentication** → **Providers**
2. Pastikan **Email** provider aktif
3. Buka **Database** → **Roles**
4. Pastikan `anon` dan `authenticated` role ada

---

## 2. Setup Cloudinary (untuk penyimpanan foto)

### Step 1: Buat Akun Cloudinary

1. Buka https://cloudinary.com
2. Klik **"Sign Up For Free"**
3. Daftar dengan email atau GitHub/Google

### Step 2: Ambil Credentials

Setelah login, buka **Dashboard** → **Settings** → **API Keys**:

```
Cloud Name:  xxxxxxxxx        (di halaman utama dashboard)
API Key:     xxxxxxxxx        (di Settings → API Keys)
API Secret:  xxxxxxxxxxxxxxxx (klik "Reveal" lalu copy)
```

> **PENTING**: API Secret hanya ditampilkan sekali. Simpan segera!

### Step 3: Setup Folder Upload (opsional)

1. Buka **Settings** → **Upload**
2. Di bagian **Upload presets**, klik **"Add upload preset"**
3. Isi:
   - **Preset name**: `absensi-presets`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `attendance`
4. Klik **Save**

---

## 3. Setup Vercel

### Step 1: Push ke GitHub
```bash
# Init git
git init
git add .
git commit -m "Initial commit"

# Buat repo baru di GitHub, lalu:
git remote add origin https://github.com/username/presensia.git
git push -u origin main
```

### Step 2: Deploy ke Vercel
1. Buka https://vercel.com
2. Sign up / Login dengan GitHub
3. Klik "Add New..." → "Project"
4. Pilih repo `presensia`
5. Framework: **Next.js** (auto-detected)
6. Klik "Deploy"

### Step 3: Setup Environment Variables
Di Vercel Dashboard → project → **Settings** → **Environment Variables**:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=https://presensia.app
CRON_SECRET=your_random_secret_string
PHOTO_RETENTION_DAYS=3
```

### Step 4: Setup Custom Domain
1. Vercel Dashboard → **Settings** → **Domains**
2. Tambah: `presensia.app`
3. Update DNS di domain provider:
   - Type: CNAME
   - Name: absensi
   - Value: cname.vercel-dns.com

### Step 5: Setup Cron Job (Auto-Delete Photos)
Vercel mendukung cron jobs via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/delete-photos",
      "schedule": "0 0 * * *"
    }
  ]
}
```

> **Note**: Vercel cron hanya tersedia di **Hobby** plan ke atas (gratis untuk personal use).

---

## 4. Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGci...` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `abc123` |
| `R2_ACCESS_KEY_ID` | R2 access key | `...` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | `...` |
| `R2_BUCKET_NAME` | R2 bucket name | `presensia-photos` |
| `R2_PUBLIC_URL` | Public URL for photos | `https://photos.presensia.app` |
| `NEXT_PUBLIC_APP_URL` | App base URL | `https://presensia.app` |
| `CRON_SECRET` | Secret for cron job auth | `random_string_123` |

---

## 5. Post-Deployment Checklist

- [ ] Database schema sudah di-run di Supabase
- [ ] User admin sudah dibuat di Supabase Auth
- [ ] Geofence sudah di-insert ke database
- [ ] CORS sudah dikonfigurasi di R2
- [ ] Environment variables sudah di-set di Vercel
- [ ] Custom domain sudah aktif
- [ ] HTTPS sudah jalan
- [ ] Cron job sudah aktif
- [ ] Test login karyawan
- [ ] Test check-in dengan selfie + GPS
- [ ] Test admin dashboard
- [ ] Test auto-delete foto

---

## 6. Monitoring & Logs

### Supabase
- Dashboard → **Logs** → **Postgres** (query logs)
- Dashboard → **Logs** → **Auth** (login logs)

### Vercel
- Dashboard → **Functions** → **Logs** (API logs)
- Dashboard → **Deployments** → **Logs** (build logs)

### Cloudflare R2
- Dashboard → **R2** → **Metrics** (storage & bandwidth)

---

## 7. Backup Strategy

### Database (Supabase)
- Supabase otomatis backup harian (7 hari retention)
- Manual backup: Supabase Dashboard → **Database** → **Backups**

### Photos (Cloudflare R2)
- R2 mendukung versioning (aktifkan jika perlu)
- Manual backup ke local storage (opsional)
