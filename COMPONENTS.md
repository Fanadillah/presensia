# COMPONENTS.md — Frontend Architecture

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Camera**: browser-native getUserMedia
- **GPS**: Browser Geolocation API
- **State**: React hooks + Server Actions

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing/redirect
│   ├── (auth)/
│   │   ├── layout.tsx          # Auth layout (centered)
│   │   └── login/
│   │       └── page.tsx        # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard layout (sidebar)
│   │   ├── page.tsx            # Dashboard admin
│   │   ├── attendance/
│   │   │   └── page.tsx        # Rekap absensi
│   │   ├── employees/
│   │   │   ├── page.tsx        # List karyawan
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Detail karyawan
│   │   ├── geofence/
│   │   │   └── page.tsx        # Kelola geofence
│   │   ├── audit/
│   │   │   └── page.tsx        # Audit log
│   │   └── settings/
│   │       └── page.tsx        # Pengaturan
│   ├── (employee)/
│   │   ├── layout.tsx          # Employee layout (simple)
│   │   ├── page.tsx            # Home karyawan (check-in/out)
│   │   └── history/
│   │       └── page.tsx        # Riwayat absensi
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── attendance/
│       │   ├── check-in/route.ts
│       │   ├── check-out/route.ts
│       │   ├── today/route.ts
│       │   └── history/route.ts
│       ├── admin/
│       │   ├── dashboard/route.ts
│       │   ├── employees/
│       │   │   ├── route.ts
│       │   │   └── [id]/route.ts
│       │   ├── attendance/route.ts
│       │   ├── rekap/route.ts
│       │   └── audit-log/route.ts
│       ├── geofence/
│       │   └── route.ts
│       ├── upload/
│       │   └── photo/route.ts
│       ├── settings/
│       │   └── route.ts
│       └── cron/
│           └── delete-photos/route.ts
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx         # Sidebar navigasi
│   │   ├── Header.tsx          # Header dengan user info
│   │   ├── MobileNav.tsx       # Bottom navigation mobile
│   │   └── AuthGuard.tsx       # Protected route wrapper
│   ├── attendance/
│   │   ├── CheckInButton.tsx   # Tombol check-in besar
│   │   ├── CheckOutButton.tsx  # Tombol check-out
│   │   ├── CameraCapture.tsx   # Komponen ambil selfie
│   │   ├── GPSStatus.tsx       # Status GPS saat ini
│   │   ├── GeofenceMap.tsx     # Peta lokasi geofence
│   │   ├── AttendanceCard.tsx  # Card status hari ini
│   │   └── AttendanceHistory.tsx # Tabel riwayat
│   ├── admin/
│   │   ├── DashboardStats.tsx  # Statistik overview
│   │   ├── EmployeeList.tsx    # Tabel daftar karyawan
│   │   ├── AttendanceTable.tsx # Tabel absensi
│   │   ├── RecapTable.tsx      # Tabel rekap bulanan
│   │   ├── AuditLogTable.tsx   # Tabel audit log
│   │   └── PhotoViewer.tsx     # Modal lihat foto
│   ├── employee/
│   │   ├── ProfileCard.tsx     # Card profil karyawan
│   │   └── MonthlyRecap.tsx    # Rekap bulanan pribadi
│   └── shared/
│       ├── LoadingSpinner.tsx  # Loading indicator
│       ├── ErrorAlert.tsx      # Error message
│       ├── SuccessToast.tsx    # Success notification
│       ├── ConfirmDialog.tsx   # Konfirmasi dialog
│       ├── EmptyState.tsx      # State kosong
│       └── PageTitle.tsx       # Judul halaman
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase browser client
│   │   ├── server.ts           # Supabase server client
│   │   └── middleware.ts       # Auth middleware
│   ├── utils.ts                # Utility functions
│   ├── geofence.ts             # Geofence validation (haversine)
│   ├── camera.ts               # Camera utilities
│   └── constants.ts            # App constants
├── hooks/
│   ├── useGeolocation.ts       # GPS hook
│   ├── useCamera.ts            # Camera hook
│   ├── useAttendance.ts        # Attendance logic hook
│   └── useAuth.ts              # Auth hook
├── types/
│   └── index.ts                # TypeScript types
└── styles/
    └── globals.css             # Global styles + Tailwind
```

## Component Descriptions

### Layout Components

#### `Sidebar.tsx`
- Navigasi desktop (kiri)
- Menu: Dashboard, Absensi, Karyawan, Geofence, Audit, Settings
- Highlight halaman aktif
- Collapse di tablet

#### `MobileNav.tsx`
- Bottom navigation untuk mobile
- Ikon + label
- 4 menu utama: Home, Riwayat, Profil, (Admin: Dashboard)

#### `AuthGuard.tsx`
- Wrapper untuk protected routes
- Cek token di cookie
- Redirect ke /login jika belum auth
- Cek role untuk admin pages

### Attendance Components

#### `CameraCapture.tsx`
- Buka kamera depan (selfie mode)
- Preview sebelum submit
- Tombol ambil foto
- Upload langsung setelah ambil
- Fallback ke file input jika kamera tidak tersedia

#### `CheckInButton.tsx`
- Tombol besar "CHECK IN"
- Loading state saat proses
- Disable jika sudah check-in
- Tampilkan status GPS & geofence

#### `GPSStatus.tsx`
- Indikator status GPS
- Tampilkan akurasi
- Warning jika akurasi rendah
- Loading saat mengambil lokasi

### Admin Components

#### `DashboardStats.tsx`
- Total karyawan
- Sudah check-in hari ini
- Belum check-in
- Terlambat
- Dengan ikon dan warna

#### `AttendanceTable.tsx`
- Tabel dengan kolom: Nama, Waktu, Status, Foto, Lokasi
- Filter tanggal
- Pagination
- Klik foto untuk zoom

## Responsive Design

### Breakpoints
- Mobile: < 640px (default)
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile-First Approach
1. **Login**: Form full-width, centered
2. **Check-in**: Tombol besar full-width, mudah diakses
3. **Dashboard**: Card layout, scrollable
4. **Tabel**: Horizontal scroll di mobile
5. **Navigation**: Bottom nav di mobile, sidebar di desktop
6. **Foto**: Preview modal full-screen di mobile

### Touch Targets
- Semua tombol minimal 44x44px (Apple HIG)
- Spacing antar elemen minimal 8px
- Swipe gestures untuk navigasi

## Color Scheme

```css
:root {
  --primary: #2563eb;      /* Blue */
  --primary-dark: #1d4ed8;
  --success: #16a34a;       /* Green */
  --warning: #d97706;       /* Amber */
  --danger: #dc2626;        /* Red */
  --background: #f8fafc;    /* Slate-50 */
  --foreground: #0f172a;    /* Slate-900 */
  --card: #ffffff;
  --muted: #64748b;         /* Slate-500 */
}
```

## Animation & Transitions

- Page transitions: fade-in 200ms
- Button hover: scale 1.02
- Loading: pulse animation
- Toast: slide-in dari kanan
- Modal: fade-in + scale
