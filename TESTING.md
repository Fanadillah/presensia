# TESTING.md — Testing Strategy

## Overview

Panduan testing untuk Presensia. Menggunakan pendekatan testing bertingkat:

1. **Unit Testing** — Test fungsi individual
2. **Integration Testing** — Test API endpoints
3. **E2E Testing** — Test seluruh alur user

---

## Tech Stack Testing

| Tool | Purpose | Gratis? |
|------|---------|---------|
| Jest | Unit testing | Ya |
| React Testing Library | Component testing | Ya |
| Supertest | API testing | Ya |
| Playwright | E2E testing | Ya |

---

## 1. Unit Testing

### Fungsi Geofence (Haversine)

```typescript
// __tests__/lib/geofence.test.ts
import { isWithinGeofence, calculateDistance } from '@/lib/geofence';

describe('Geofence Validation', () => {
  const geofenceLat = -6.2088;
  const geofenceLon = 106.8456;
  const radius = 100; // meters

  test('should return true when within geofence', () => {
    // Titik sangat dekat dengan pusat
    const distance = calculateDistance(
      geofenceLat, geofenceLon,
      -6.2089, 106.8457
    );
    expect(distance).toBeLessThan(radius);
  });

  test('should return false when outside geofence', () => {
    // Titik 1km jauhnya
    const distance = calculateDistance(
      geofenceLat, geofenceLon,
      -6.2188, 106.8456
    );
    expect(distance).toBeGreaterThan(radius);
  });

  test('should calculate distance correctly', () => {
    // 1 derajat latitude ≈ 111 km
    const distance = calculateDistance(
      geofenceLat, geofenceLon,
      geofenceLat + 0.001, geofenceLon
    );
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });
});
```

### Fungsi Camera

```typescript
// __tests__/lib/camera.test.ts
import { validateImage, compressImage } from '@/lib/camera';

describe('Camera Utilities', () => {
  test('should reject files larger than 5MB', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', {
      type: 'image/jpeg'
    });
    const result = await validateImage(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('terlalu besar');
  });

  test('should reject non-image files', async () => {
    const textFile = new File(['hello'], 'test.txt', {
      type: 'text/plain'
    });
    const result = await validateImage(textFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });
});
```

---

## 2. Integration Testing

### Auth API

```typescript
// __tests__/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/login/route';

describe('Auth API', () => {
  test('should login with valid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
```

### Attendance API

```typescript
// __tests__/api/attendance.test.ts
describe('Attendance API', () => {
  test('should check-in successfully', async () => {
    // Mock authenticated request
    const formData = new FormData();
    formData.append('photo', mockPhotoFile);
    formData.append('latitude', '-6.2088');
    formData.append('longitude', '106.8456');
    formData.append('accuracy', '10');

    const request = new Request('http://localhost/api/attendance/check-in', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${mockToken}`
      }
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.is_within_geofence).toBe(true);
  });

  test('should reject check-in outside geofence', async () => {
    const formData = new FormData();
    formData.append('photo', mockPhotoFile);
    formData.append('latitude', '-6.3000'); // Jauh dari geofence
    formData.append('longitude', '106.9000');
    formData.append('accuracy', '10');

    const request = new Request('http://localhost/api/attendance/check-in', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${mockToken}`
      }
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('geofence');
  });
});
```

---

## 3. E2E Testing (Playwright)

### Login Flow

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully as karyawan', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'karyawan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to home
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Should show check-in button
    await expect(page.locator('text=CHECK IN')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Should show error toast
    await expect(page.locator('text=Email atau password salah')).toBeVisible();
  });
});
```

### Check-In Flow

```typescript
// e2e/checkin.spec.ts
test.describe('Check-In Flow', () => {
  test('should complete check-in process', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'karyawan@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for home page
    await page.waitForURL('http://localhost:3000/');
    
    // Mock geolocation
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: -6.2088,
            longitude: 106.8456,
            accuracy: 10
          }
        } as GeolocationPosition);
      };
    });
    
    // Click check-in button
    await page.click('text=CHECK IN');
    
    // Should show camera modal
    await expect(page.locator('text=Ambil Selfie')).toBeVisible();
    
    // Click capture button (mocked)
    await page.click('text=Ambil Foto');
    
    // Should show success
    await expect(page.locator('text=Berhasil check-in')).toBeVisible();
  });
});
```

---

## 4. Manual Testing Checklist

### Login
- [ ] Bisa login dengan email & password benar
- [ ] Error muncul jika password salah
- [ ] Redirect ke halaman yang sesuai berdasarkan role
- [ ] Session persist (tidak logout saat refresh)

### Check-In
- [ ] Kamera depan terbuka
- [ ] GPS berhasil diambil
- [ ] Foto berhasil diambil & diupload
- [ ] Validasi geofence jalan (dalam/di luar radius)
- [ ] Data tersimpan di database
- [ ] Audit log tercatat

### Check-Out
- [ ] Bisa check-out setelah check-in
- [ ] Tidak bisa check-out sebelum check-in
- [ ] Foto & GPS tersimpan

### Dashboard Admin
- [ ] Statistik hari ini benar
- [ ] Tabel absensi lengkap
- [ ] Foto bisa dilihat
- [ ] Filter tanggal jalan
- [ ] Pagination jalan

### Rekap
- [ ] Data rekap bulanan benar
- [ ] Export CSV jalan (jika ada)
- [ ] Keterlambatan terdeteksi

### Auto-Delete
- [ ] Foto lebih dari 3 hari terhapus
- [ ] photo_url jadi NULL setelah dihapus
- [ ] Audit log tercatat

### Mobile
- [ ] Layout responsif di mobile
- [ ] Touch target cukup besar (44x44px)
- [ ] Kamera jalan di mobile browser
- [ ] GPS jalan di mobile browser
- [ ] Bottom navigation jalan

---

## 5. Running Tests

```bash
# Unit & Integration tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (perlu start dev server dulu)
npm run dev &
npm run test:e2e
```

---

## 6. Test Data

Buat test data di Supabase:

```sql
-- Test users
INSERT INTO users (email, full_name, role, password_hash) VALUES
('admin@test.com', 'Admin Test', 'admin', '...'),
('karyawan@test.com', 'Karyawan Test', 'karyawan', '...');

-- Test geofence
INSERT INTO geofence (name, latitude, longitude, radius_meters) VALUES
('Kantor Pusat', -6.2088, 106.8456, 100);
```
