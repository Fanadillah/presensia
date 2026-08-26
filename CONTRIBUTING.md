# CONTRIBUTING.md — Panduan untuk Developer

## Selamat Datang!

Terima kasih sudah berkontribusi di proyek Presensia.

---

## Development Setup

```bash
# 1. Fork & clone
git clone https://github.com/your-username/presensia.git
cd presensia

# 2. Install dependencies
npm install

# 3. Copy env
cp .env.example .env.local

# 4. Isi .env.local (lihat SETUP.md)

# 5. Jalankan dev server
npm run dev
```

---

## Branch Strategy

| Branch | Untuk apa |
|--------|-----------|
| `main` | Production-ready code |
| `develop` | Development utama |
| `feature/nama-fitur` | Fitur baru |
| `fix/nama-bug` | Bug fix |

```bash
# Buat branch baru
git checkout -b feature/camera-component

# Push
git push origin feature/camera-component
```

Buka Pull Request ke branch `develop`.

---

## Code Style

### TypeScript
- Gunakan TypeScript untuk semua file
- Hindari `any` type
- Buat type di `src/types/index.ts`

### Components
- Functional components dengan hooks
- File naming: `PascalCase.tsx`
- Folder per feature

### API Routes
- File naming: `route.ts`
- Selalu return JSON dengan format:
  ```json
  { "success": true/false, "data": {}, "error": "" }
  ```

### CSS
- Gunakan Tailwind CSS
- Responsive design (mobile-first)
- Ikuti color scheme yang ada

---

## Commit Convention

Gunakan format:

```
type(scope): deskripsi

type:
- feat: fitur baru
- fix: bug fix
- docs: dokumentasi
- style: styling
- refactor: refactor kode
- test: tambah test
- chore: maintenance

Contoh:
feat(attendance): tambah komponen CameraCapture
fix(auth): handle token expired
docs(API): tambah endpoint documentation
```

---

## Pull Request Process

1. Buat branch dari `develop`
2. Buat perubahan
3. Test locally
4. Push ke GitHub
5. Buka PR ke `develop`
6. Isi description dengan jelas
7. Tunggu review

### PR Template

```markdown
## Deskripsi
[Penjelasan singkat perubahan]

## Type of Change
- [ ] Fitur baru
- [ ] Bug fix
- [ ] Refactor
- [ ] Dokumentasi

## Checklist
- [ ] Code sudah di-test
- [ ] Tidak ada console.log yang tertinggal
- [ ] Responsive di mobile
- [ ] Documentation diupdate (jika perlu)
```

---

## File Structure

```
src/
├── app/              # Pages & API routes
├── components/       # React components
│   ├── ui/          # shadcn/ui
│   ├── layout/      # Layout components
│   ├── attendance/  # Attendance features
│   ├── admin/       # Admin features
│   └── shared/      # Shared components
├── lib/             # Utilities
├── hooks/           # Custom hooks
└── types/           # TypeScript types
```

---

## API Convention

### Request
```typescript
// GET /api/attendance/today
// Headers: Authorization: Bearer <token>

// POST /api/attendance/check-in
// Headers: Authorization: Bearer <token>
// Body: FormData { photo, latitude, longitude, accuracy }
```

### Response
```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Pesan error",
  "code": "ERROR_CODE"
}
```

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run dev &
npm run test:e2e
```

---

## Questions?

Buka GitHub Issue atau diskusi di PR.
