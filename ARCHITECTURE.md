# ARCHITECTURE.md — Visual Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser HP)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Login   │ │  Home    │ │Dashboard │ │  Rekap   │    │  │
│  │  │  Page    │ │ (Karyawan│ │ (Admin)  │ │  (Admin) │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              Shared Components                       │  │  │
│  │  │  [Camera] [GPS] [Geofence] [Toast] [Modal] [Table] │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Next.js Server)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   API Routes                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │/api/auth │ │/api/     │ │/api/     │ │/api/     │    │  │
│  │  │          │ │attendance│ │admin     │ │upload    │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │  ┌──────────┐ ┌──────────┐                               │  │
│  │  │/api/     │ │/api/     │                               │  │
│  │  │geofence  │ │cron      │                               │  │
│  │  └──────────┘ └──────────┘                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
                ▼                                 ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│      SUPABASE             │   │        CLOUDFLARE Cloudinary            │
│  ┌─────────────────────┐  │   │  ┌───────────────────────────┐  │
│  │  PostgreSQL Database│  │   │  │     Object Storage        │  │
│  │  ┌───────────────┐  │  │   │  │  ┌─────────────────────┐  │  │
│  │  │ users         │  │  │   │  │  │ photos/             │  │  │
│  │  │ attendance    │  │  │   │  │  │  ├── uuid1.jpg      │  │  │
│  │  │ geofence      │  │  │   │   │  │  ├── uuid2.jpg      │  │  │
│  │  │ audit_log     │  │  │   │   │  │  └── uuid3.jpg      │  │  │
│  │  │ settings      │  │  │   │   │  └─────────────────────┘  │  │
│  │  └───────────────┘  │  │   │  └───────────────────────────┘  │
│  └─────────────────────┘  │   └─────────────────────────────────┘
│  ┌─────────────────────┐  │
│  │  Auth (JWT)         │  │
│  │  - Login            │  │
│  │  - Session          │  │
│  │  - Roles            │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

---

## Data Flow: Check-In

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Karyawan │     │  Browser │     │  Vercel  │     │ Services │
│  (HP)     │     │  App     │     │  API     │     │          │
└─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘
      │                │                │                │
      │ 1. Klik        │                │                │
      │ "CHECK IN"     │                │                │
      │───────────────▶│                │                │
      │                │                │                │
      │                │ 2. Minta       │                │
      │                │ Kamera + GPS   │                │
      │◀───────────────│                │                │
      │                │                │                │
      │ 3. Ambil       │                │                │
      │ Selfie + GPS   │                │                │
      │───────────────▶│                │                │
      │                │                │                │
      │                │ 4. POST        │                │
      │                │ /api/attendance│                │
      │                │ /check-in      │                │
      │                │───────────────▶│                │
      │                │                │                │
      │                │                │ 5. Upload      │
      │                │                │ Foto           │
      │                │                │───────────────▶│
      │                │                │                │ (R2)
      │                │                │                │
      │                │                │ 6. Insert      │
      │                │                │ + Validate     │
      │                │                │ Geofence       │
      │                │                │───────────────▶│
      │                │                │                │ (Supabase)
      │                │                │                │
      │                │ 7. Response    │                │
      │                │ Success/Error  │                │
      │                │◀───────────────│                │
      │                │                │                │
      │ 8. Toast       │                │                │
      │ Sukses/Error   │                │                │
      │◀───────────────│                │                │
      │                │                │                │
```

---

## Database Schema (ERD)

```
┌─────────────────────┐
│        users         │
├─────────────────────┤
│ id (PK, UUID)       │
│ email (UNIQUE)      │──────┐
│ full_name           │      │
│ role                │      │
│ phone               │      │
│ photo_url           │      │
│ is_active           │      │
│ created_at          │      │
│ updated_at          │      │
└─────────────────────┘      │
                             │
        ┌────────────────────┤
        │                    │
        │ 1:N                │ 1:N
        ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐
│     attendance       │  │     audit_log        │
├─────────────────────┤  ├─────────────────────┤
│ id (PK, UUID)       │  │ id (PK, UUID)       │
│ user_id (FK) ◀──────┤  │ user_id (FK) ◀──────┘
│ type                 │  │ action              │
│ photo_url            │  │ details (JSONB)     │
│ latitude             │  │ ip_address          │
│ longitude            │  │ user_agent          │
│ accuracy             │  │ created_at          │
│ is_within_geofence   │  └─────────────────────┘
│ geofence_id (FK)─────┤
│ notes                │  ┌─────────────────────┐
│ recorded_at          │  │     geofence         │
│ created_at           │  ├─────────────────────┤
└──────────────────────┘  │ id (PK, UUID)       │◄──┐
                          │ name                 │   │
                          │ latitude             │───┘
                          │ longitude            │
                          │ radius_meters        │
                          │ is_active            │
                          │ created_at           │
                          │ updated_at           │
                          └─────────────────────┘

                          ┌─────────────────────┐
                          │     settings         │
                          ├─────────────────────┤
                          │ id (PK, UUID)       │
                          │ key (UNIQUE)        │
                          │ value               │
                          │ description         │
                          │ updated_at          │
                          └─────────────────────┘
```

---

## Component Architecture

```
App
├── AuthGuard ─────────── Cek login status
│   ├── true ──────────── Render children
│   └── false ─────────── Redirect /login
│
├── Layout
│   ├── Desktop
│   │   ├── Sidebar (kiri)
│   │   ├── Header (atas)
│   │   └── Main Content (kanan)
│   │
│   └── Mobile
│       ├── Header (atas)
│       ├── Main Content (tengah)
│       └── BottomNav (bawah)
│
├── Pages
│   ├── /login
│   │   └── LoginForm
│   │
│   ├── / (karyawan)
│   │   ├── AttendanceCard
│   │   ├── CheckInButton
│   │   ├── CameraCapture
│   │   └── GPSStatus
│   │
│   ├── /dashboard (admin)
│   │   ├── DashboardStats
│   │   ├── AttendanceTable
│   │   └── PhotoViewer
│   │
│   ├── /employees (admin)
│   │   ├── EmployeeList
│   │   └── EmployeeForm
│   │
│   ├── /attendance (admin)
│   │   ├── RecapTable
│   │   └── DateFilter
│   │
│   ├── /geofence (admin)
│   │   ├── GeofenceList
│   │   └── GeofenceForm
│   │
│   └── /audit (admin)
│       └── AuditLogTable
│
└── Shared
    ├── Toast
    ├── Modal
    ├── LoadingSpinner
    ├── ErrorAlert
    └── EmptyState
```

---

## Mobile Layout

```
┌─────────────────────────┐
│  Header          [User] │
├─────────────────────────┤
│                         │
│    ┌─────────────────┐  │
│    │   Hari Ini      │  │
│    │   23 Agustus    │  │
│    │                 │  │
│    │  ┌───────────┐  │  │
│    │  │           │  │  │
│    │  │ CHECK IN  │  │  │
│    │  │           │  │  │
│    │  └───────────┘  │  │
│    │                 │  │
│    │  GPS: Active    │  │
│    │  Radius: 50m    │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
├─────────────────────────┤
│  🏠    📋    👤    ⚙️   │
│ Home History Profile Menu│
└─────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Vercel    │    │  Supabase   │    │ Cloudflare  │ │
│  │   (CDN)     │    │  (Database) │    │    Cloudinary       │ │
│  │             │    │             │    │  (Storage)  │ │
│  │  Next.js    │    │ PostgreSQL  │    │   Photos    │ │
│  │  App        │────│ + Auth      │    │             │ │
│  │             │    │             │    │             │ │
│  └──────┬──────┘    └─────────────┘    └─────────────┘ │
│         │                                              │
│         │ HTTPS                                        │
│         ▼                                              │
│  ┌─────────────┐                                       │
│  │   Custom    │                                       │
│  │   Domain    │                                       │
│  │  (absensi.  │                                       │
│  │ presensia │                                       │
│  │   .com)     │                                       │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```
