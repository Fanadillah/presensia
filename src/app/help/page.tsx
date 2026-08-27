'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  HelpCircle,
  LogIn,
  CalendarDays,
  PlaneTakeoff,
  UserRound,
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Users,
  MapPin,
  Megaphone,
  ScrollText,
  Settings,
  Camera,
  MapPinned,
  Clock3,
  AlertTriangle,
} from 'lucide-react';

type Role = 'karyawan' | 'admin' | 'owner';

interface HelpSection {
  icon: React.ElementType;
  title: string;
  desc: string;
  steps: string[];
  tips?: string;
  roles: Role[];
}

const sections: HelpSection[] = [
  // Karyawan
  {
    icon: LogIn,
    title: 'Absen (Check-in / Check-out)',
    desc: 'Ambil selfie + GPS untuk absen harian. Kamera mirror, GPS butuh izin lokasi.',
    steps: [
      'Buka Beranda → lihat jam kerja di card Absensi Hari Ini (mis. 08:00 • Telat >08:15).',
      'Klik Absen Sekarang / Check Out (jika sudah check-in).',
      'Izinkan Kamera & Lokasi saat diminta browser.',
      'Ambil selfie, preview → Ulang jika buram atau ✓ Konfirmasi.',
      'Tunggu upload (foto di-watermark jam + koordinat). Status akan update di Beranda & Riwayat.',
    ],
    tips: 'Gagal kamera hitam setelah Ulang? Tutup lalu buka lagi Absen. GPS error? Klik Perbarui di card Peta.',
    roles: ['karyawan', 'admin'],
  },
  {
    icon: CalendarDays,
    title: 'Riwayat Absensi',
    desc: 'Lihat kehadiran harian, jam masuk/pulang, durasi, dan status terlambat.',
    steps: [
      'Buka menu Riwayat (karyawan/admin).',
      'Filter bulan, lihat kalender warna & list harian.',
      'Klik hari untuk detail foto & peta (jika ada).',
    ],
    roles: ['karyawan', 'admin'],
  },
  {
    icon: PlaneTakeoff,
    title: 'Cuti, Izin & Sakit (Karyawan)',
    desc: 'Ajukan cuti/izin/sakit, pantau status pending/approved/rejected.',
    steps: [
      'Buka Cuti & Izin → + Ajukan.',
      'Pilih tipe (cuti/izin/sakit), rentang tanggal, alasan.',
      'Kirim → tunggu admin/owner approve di menu Cuti & Lembur.',
      'Status bisa dipantau, yang pending masih bisa dibatalkan.',
    ],
    roles: ['karyawan', 'admin'],
  },
  {
    icon: UserRound,
    title: 'Profil & Akun',
    desc: 'Ganti foto profil (crop), lihat info akun.',
    steps: ['Buka Profil → ganti foto / lihat email & role.'],
    roles: ['karyawan', 'admin', 'owner'],
  },
  // Admin
  {
    icon: LayoutDashboard,
    title: 'Dashboard Admin (Monitoring)',
    desc: 'Pantau real-time siapa sudah/belum absen, terlambat, di luar area + tren 7 hari.',
    steps: [
      'Login sebagai admin → otomatis ke Beranda karyawan + card Kelola Tim → Buka Dashboard.',
      'Lihat 4 stat: Total Karyawan, Sudah Check-in, Belum Check-in, Terlambat (+ di luar area).',
      'Grafik Tren 7 Hari: hijau Hadir, amber Telat.',
      'Panel Belum Absen: list yang belum absen + link Lihat Rekap.',
      'Absensi Terbaru: 8 aktivitas terakhir + badge Terlambat.',
    ],
    roles: ['admin', 'owner'],
  },
  {
    icon: ClipboardList,
    title: 'Rekap Absensi (Admin/Owner)',
    desc: 'Tabel semua karyawan harian dengan filter, pagination, export CSV/print.',
    steps: ['Buka Rekap Absensi → filter tanggal/karyawan → Export CSV atau Cetak.'],
    roles: ['admin', 'owner'],
  },
  {
    icon: Wallet,
    title: 'Rekap Gaji',
    desc: 'Rekap bulanan per karyawan: Hadir, Terlambat, Cuti, Lembur, Total Kerja (jam). Untuk dasar hitung gaji.',
    steps: ['Buka Rekap Gaji → pilih bulan → lihat tabel → Export CSV / Cetak.'],
    tips: 'Nominal gaji belum auto-hitung (backlog Fase 10 shift). Data ini untuk finance hitung manual.',
    roles: ['admin', 'owner'],
  },
  {
    icon: Users,
    title: 'Kelola Karyawan',
    desc: 'Tambah/edit/nonaktifkan akun, atur role (admin hanya bisa kelola karyawan).',
    steps: ['Buka Karyawan → + Tambah → isi email/nama/role → simpan. Klik baris untuk detail/riwayat.'],
    roles: ['admin', 'owner'],
  },
  {
    icon: Megaphone,
    title: 'Pengumuman',
    desc: 'Buat pengumuman yang tampil di Beranda semua karyawan.',
    steps: ['Buka Pengumuman → + Buat → isi judul & isi → aktifkan.'],
    roles: ['admin', 'owner'],
  },
  {
    icon: PlaneTakeoff,
    title: 'Kelola Cuti & Lembur (Approve)',
    desc: 'Admin/owner approve/reject pengajuan cuti & lembur.',
    steps: ['Buka Cuti & Lembur → tab Cuti / Lembur → klik Approve/Reject + catatan.'],
    roles: ['admin', 'owner'],
  },
  {
    icon: ScrollText,
    title: 'Audit Log',
    desc: 'Jejak semua aktivitas (check-in/out, approve, hapus) untuk audit.',
    steps: ['Buka Audit Log → filter user/aksi/tanggal → pantau.'],
    roles: ['admin', 'owner'],
  },
  // Owner only
  {
    icon: MapPin,
    title: 'Geofence (Owner)',
    desc: 'Atur titik kantor & radius (10m - 10km) untuk validasi GPS (haversine).',
    steps: ['Buka Geofence → klik peta untuk titik → set radius → simpan → toggle aktif.'],
    tips: 'Absen di luar radius tetap tersimpan tapi ditandai di luar area & di Dashboard.',
    roles: ['owner'],
  },
  {
    icon: Settings,
    title: 'Pengaturan (Owner)',
    desc: 'Atur jam kerja global (check_in_start, late_threshold) yang tampil di Beranda karyawan & dipakai hitung telat.',
    steps: ['Buka Pengaturan → ubah Jam Masuk (mis. 08:00) & Toleransi (15) → Simpan. Beranda karyawan badge Jam akan update.'],
    tips: 'Mode Shift per orang/divisi (backlog Fase 10) akan tambah di sini nanti.',
    roles: ['owner'],
  },
  // Umum
  {
    icon: AlertTriangle,
    title: 'Troubleshooting',
    desc: 'Solusi umum gagal absen.',
    steps: [
      'Situs berbahaya di vercel.app: pakai https, klik Detail → Kunjungi tetap, atau pakai custom domain.',
      'Kamera hitam setelah Ulang: tutup Absen lalu buka lagi (sudah fix mirror).',
      'GPS tidak akurat: di luar ruangan, klik Perbarui, izinkan Lokasi Akurat.',
      'Foto gagal upload: cek koneksi, ukuran <5MB, coba lagi.',
    ],
    roles: ['karyawan', 'admin', 'owner'],
  },
];

function RoleTabs({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const tabs: { key: Role; label: string }[] = [
    { key: 'karyawan', label: 'Karyawan' },
    { key: 'admin', label: 'Admin' },
    { key: 'owner', label: 'Owner' },
  ];
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${value === t.key ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const { user } = useAuth();
  const initial: Role = (user?.role as Role) || 'karyawan';
  const [tab, setTab] = useState<Role>(initial);
  const [onlyMine, setOnlyMine] = useState(true);

  const filtered = sections.filter((s) => (onlyMine ? s.roles.includes(tab) : true));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageTitle
        title="Panduan Penggunaan"
        description={`Hak akses kamu: ${tab} — ${onlyMine ? 'hanya fitur role ini' : 'semua fitur'}`}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="font-medium">Pilih role untuk lihat panduan:</span>
          </div>
          <RoleTabs value={tab} onChange={setTab} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="h-4 w-4 rounded border-border" />
          Hanya tampilkan fitur untuk role {tab}
        </label>
        {user && (
          <p className="mt-2 text-xs text-muted-foreground">
            Kamu login sebagai <span className="font-semibold capitalize text-foreground">{user.role}</span> — tab otomatis ke {initial}.
          </p>
        )}
      </Card>

      <div className="grid gap-4">
        {filtered.map((s) => (
          <Card key={s.title} className="p-5">
            <div className="flex gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <div className="flex gap-1">
                    {s.roles.map((r) => (
                      <Badge key={r} variant={r === tab ? 'primary' : 'default'} className="capitalize text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-foreground">
                  {s.steps.map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
                {s.tips && (
                  <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs text-warning-foreground flex gap-2">
                    <Clock3 className="h-4 w-4 shrink-0" />
                    <span><b>Tips:</b> {s.tips}</span>
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-dashed p-5">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><MapPinned className="h-4 w-4" /> Butuh bantuan?</h4>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin/owner atau cek Audit Log & Pengumuman untuk info terbaru. Kamera & GPS butuh HTTPS dan izin browser.</p>
      </Card>
    </div>
  );
}
