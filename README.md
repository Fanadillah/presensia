# Presensia

Sistem absensi online berbasis GPS & selfie untuk karyawan Presensia.

## Fitur

- **Login** - Autentikasi karyawan & admin
- **Selfie Check-in/Out** - Ambil foto saat absen
- **GPS & Geofence** - Validasi lokasi otomatis
- **Dashboard Admin** - Monitoring real-time
- **Auto-Delete Foto** - Foto terhapus otomatis setiap 3 hari
- **Mobile-Friendly** - Dirancang untuk diakses dari HP

## Tech Stack

- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth)
- Cloudflare R2 (Object Storage)
- Tailwind CSS

**100% Gratis** - Semua menggunakan free tier.

## Quick Start

```bash
# Install dependencies
npm install

# Setup R2 bucket (via CLI)
npm run setup:r2

# Copy environment template
cp .env.example .env.local

# Isi .env.local dengan credentials Supabase & R2

# Jalankan dev server
npm run dev
```

Buka http://localhost:3000

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [SETUP.md](../SETUP.md) | Panduan setup lengkap |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Panduan deploy |
| [API.md](../API.md) | API endpoints |
| [SCHEMA.md](../SCHEMA.md) | Database schema |

## Scripts

```bash
npm run dev           # Jalankan dev server
npm run build         # Build untuk production
npm run setup:r2      # Setup R2 bucket (Linux/Mac)
npm run setup:r2:win  # Setup R2 bucket (Windows)
npm run cleanup:r2    # Cleanup foto lama
```

## License

MIT License
