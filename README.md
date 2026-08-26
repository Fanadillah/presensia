# README.md — Presensia

## Tentang

Sistem absensi online berbasis GPS & selfie untuk karyawan Presensia. Karyawan melakukan check-in/out melalui browser mobile dengan validasi lokasi (geofence) dan foto selfie.

### Fitur Utama

- **Login** — Autentikasi karyawan & admin
- **Selfie Check-in/Out** — Ambil foto saat absen sebagai bukti
- **GPS & Geofence** — Validasi lokasi otomatis
- **Dashboard Admin** — Monitoring real-time semua karyawan
- **Rekap Absensi** — Rekap harian & bulanan otomatis
- **Audit Log** — Log semua aktivitas sistem
- **Auto-Delete Foto** — Foto terhapus otomatis setiap 3 hari
- **Mobile-Friendly** — Dirancang untuk diakses dari HP

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Cloudinary (25 credits free tier) |
| Hosting | Vercel |

**100% Gratis** — Semua menggunakan free tier.

---

## Screenshots

> Belum tersedia. Akan ditambahkan setelah deployment.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm atau yarn
- Akun Supabase (gratis)
- Akun Cloudflare (gratis)

### Instalasi

```bash
# Clone repo
git clone https://github.com/username/presensia.git
cd presensia

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Isi environment variables (lihat SETUP.md)
# ...

# Jalankan development server
npm run dev
```

Buka http://localhost:3000

---

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [PROJECT.md](PROJECT.md) | Overview & Tech Stack |
| [SCHEMA.md](SCHEMA.md) | Database Schema |
| [API.md](API.md) | API Endpoints |
| [COMPONENTS.md](COMPONENTS.md) | Frontend Architecture |
| [FLOWS.md](FLOWS.md) | User Flow & Business Logic |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment Guide |
| [TESTING.md](TESTING.md) | Testing Strategy |
| [SETUP.md](SETUP.md) | Setup Guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributor Guidelines |
| [TODO.md](TODO.md) | Feature Checklist |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visual Architecture |

---

## Struktur Project

```
presensia/
├── src/
│   ├── app/              # Pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities & helpers
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript types
├── public/               # Static assets
├── .env.example          # Environment template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret
```

Lihat [SETUP.md](SETUP.md) untuk panduan lengkap.

---

## License

MIT License

---

## Kontak

Untuk pertanyaan, buka issue di GitHub atau hubungi tim development.
