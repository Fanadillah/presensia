# API.md — API Endpoints

## Base URL

```
Production: https://presensia.app
Development: http://localhost:3000
```

## Authentication

Semua endpoint (kecuali auth) memerlukan header:
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

---

## 1. Auth Endpoints

### POST `/api/auth/login`

Login karyawan/admin.

**Request:**
```json
{
  "email": "karyawan@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "karyawan@example.com",
      "full_name": "Budi Santoso",
      "role": "karyawan"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_at": 1234567890
    }
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": "Email atau password salah"
}
```

### POST `/api/auth/logout`

Logout user.

**Response 200:**
```json
{
  "success": true,
  "message": "Berhasil logout"
}
```

### GET `/api/auth/me`

Get current user info.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "karyawan@example.com",
    "full_name": "Budi Santoso",
    "role": "karyawan",
    "is_active": true
  }
}
```

---

## 2. Attendance Endpoints

### POST `/api/attendance/check-in`

Check-in karyawan dengan selfie & GPS.

**Request (multipart/form-data):**
```
photo: [file] (image/jpeg, image/png)
latitude: -6.2088
longitude: 106.8456
accuracy: 10.5
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "check_in",
    "photo_url": "https://r2.example.com/photos/uuid.jpg",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "is_within_geofence": true,
    "geofence_name": "Presensia",
    "recorded_at": "2026-08-23T08:30:00Z"
  }
}
```

**Response 400:**
```json
{
  "success": false,
  "error": "Anda berada di luar area geofence"
}
```

### POST `/api/attendance/check-out`

Check-out karyawan dengan selfie & GPS.

**Request (multipart/form-data):**
```
photo: [file] (image/jpeg, image/png)
latitude: -6.2088
longitude: 106.8456
accuracy: 10.5
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "check_out",
    "photo_url": "https://r2.example.com/photos/uuid.jpg",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "recorded_at": "2026-08-23T17:00:00Z"
  }
}
```

### GET `/api/attendance/today`

Get status absensi hari ini untuk user login.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "has_check_in": true,
    "has_check_out": false,
    "check_in": {
      "id": "uuid",
      "photo_url": "...",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "is_within_geofence": true,
      "recorded_at": "2026-08-23T08:30:00Z"
    },
    "check_out": null
  }
}
```

### GET `/api/attendance/history`

Get riwayat absensi user (bulan berjalan).

**Query Parameters:**
- `month` (optional): 1-12, default bulan sekarang
- `year` (optional): 2026, default tahun sekarang

**Response 200:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "date": "2026-08-23",
        "check_in_time": "08:30:00",
        "check_out_time": "17:00:00",
        "is_late": false,
        "work_hours": 8.5,
        "check_in_photo": "...",
        "check_out_photo": "..."
      }
    ],
    "summary": {
      "total_days": 22,
      "present": 20,
      "late": 2,
      "absent": 0,
      "total_hours": 170.5
    }
  }
}
```

---

## 3. Admin Endpoints

### GET `/api/admin/dashboard`

Get dashboard data untuk admin (hanya admin/owner).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "today": {
      "total_employees": 25,
      "checked_in": 20,
      "not_yet": 5,
      "late": 3
    },
    "recent_attendance": [
      {
        "user_id": "uuid",
        "full_name": "Budi Santoso",
        "type": "check_in",
        "recorded_at": "2026-08-23T08:30:00Z",
        "is_within_geofence": true,
        "photo_url": "..."
      }
    ]
  }
}
```

### GET `/api/admin/employees`

Get semua karyawan.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "uuid",
        "email": "karyawan@example.com",
        "full_name": "Budi Santoso",
        "role": "karyawan",
        "is_active": true,
        "last_check_in": "2026-08-23T08:30:00Z",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

### POST `/api/admin/employees`

Tambah karyawan baru (admin only).

**Request:**
```json
{
  "email": "baru@example.com",
  "full_name": "Nama Baru",
  "password": "password123",
  "role": "karyawan",
  "phone": "08123456789"
}
```

### PUT `/api/admin/employees/:id`

Update data karyawan.

### DELETE `/api/admin/employees/:id`

Hapus karyawan (soft delete — set `is_active = false`).

### GET `/api/admin/attendance`

Get semua data absensi (admin view).

**Query Parameters:**
- `date`: 2026-08-23 (default hari ini)
- `user_id`: filter by user
- `page`: 1
- `limit`: 20

### GET `/api/admin/rekap`

Get rekap bulanan semua karyawan.

**Query Parameters:**
- `month`: 8
- `year`: 2026

### GET `/api/admin/audit-log`

Get audit log (admin only).

**Query Parameters:**
- `page`: 1
- `limit`: 50
- `action`: filter by action type

---

## 4. Geofence Endpoints

### GET `/api/geofence`

Get semua geofence yang aktif.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "geofences": [
      {
        "id": "uuid",
        "name": "Presensia",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "radius_meters": 100,
        "is_active": true
      }
    ]
  }
}
```

### POST `/api/geofence`

Buat geofence baru (admin only).

### PUT `/api/geofence/:id`

Update geofence.

### DELETE `/api/geofence/:id`

Hapus geofence.

---

## 5. Upload Endpoints

### POST `/api/upload/photo`

Upload foto ke Cloudflare R2.

**Request (multipart/form-data):**
```
file: [file] (image/jpeg, max 5MB)
folder: "attendance" | "profile"
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://photos.presensia.app/uuid.jpg",
    "key": "attendance/uuid.jpg",
    "size": 245760
  }
}
```

### DELETE `/api/upload/photo/:key`

Hapus foto (admin atau cron job).

---

## 6. Settings Endpoints

### GET `/api/settings`

Get semua pengaturan.

### PUT `/api/settings`

Update pengaturan (admin only).

**Request:**
```json
{
  "geofence_radius": "150",
  "check_in_start": "08:30",
  "photo_retention_days": "7"
}
```

---

## 7. Cron Job Endpoints

### POST `/api/cron/delete-photos`

Hapus foto yang lebih dari 3 hari dari Cloudflare R2.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "deleted_count": 45,
    "deleted_keys": ["attendance/uuid1.jpg", "..."]
  }
}
```

---

## Error Response Format

Semua error mengikuti format:
```json
{
  "success": false,
  "error": "Pesan error",
  "code": "ERROR_CODE"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Tidak login atau token expired |
| `FORBIDDEN` | Tidak punya akses |
| `NOT_FOUND` | Data tidak ditemukan |
| `VALIDATION_ERROR` | Input tidak valid |
| `GEOFENCE_ERROR` | Di luar area geofence |
| `DUPLICATE` | Data sudah ada |
| `UPLOAD_ERROR` | Gagal upload file |
