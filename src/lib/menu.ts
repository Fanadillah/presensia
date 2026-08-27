import {
  Home,
  CalendarDays,
  LayoutDashboard,
  ClipboardList,
  Users,
  MapPin,
  ScrollText,
  Settings,
  UserRound,
  Megaphone,
  PlaneTakeoff,
  LogIn,
  Wallet,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const commonUserMenu: MenuItem[] = [
  { href: '/absen', label: 'Absen', icon: LogIn },
  { href: '/history', label: 'Riwayat', icon: CalendarDays },
  { href: '/leave', label: 'Cuti & Izin', icon: PlaneTakeoff },
];

export const karyawanMenu: MenuItem[] = [
  { href: '/', label: 'Beranda', icon: Home },
  ...commonUserMenu,
  { href: '/profile', label: 'Profil', icon: UserRound },
  { href: '/help', label: 'Panduan', icon: HelpCircle },
];

// Admin juga absen pakai akunnya sendiri
export const adminMenu: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/absen', label: 'Absen', icon: LogIn },
  { href: '/attendance', label: 'Rekap Absensi', icon: ClipboardList },
  { href: '/payroll', label: 'Rekap Gaji', icon: Wallet },
  { href: '/employees', label: 'Karyawan', icon: Users },
  { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
  { href: '/leaves', label: 'Cuti & Lembur', icon: PlaneTakeoff },
  { href: '/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/profile', label: 'Profil', icon: UserRound },
  { href: '/help', label: 'Panduan', icon: HelpCircle },
];

export const ownerMenu: MenuItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/attendance', label: 'Rekap Absensi', icon: ClipboardList },
  { href: '/payroll', label: 'Rekap Gaji', icon: Wallet },
  { href: '/employees', label: 'Karyawan', icon: Users },
  { href: '/geofence', label: 'Geofence', icon: MapPin },
  { href: '/announcements', label: 'Pengumuman', icon: Megaphone },
  { href: '/leaves', label: 'Cuti & Lembur', icon: PlaneTakeoff },
  { href: '/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
  { href: '/profile', label: 'Profil', icon: UserRound },
  { href: '/help', label: 'Panduan', icon: HelpCircle },
];

export function getMenu(role?: string | null): MenuItem[] {
  if (role === 'owner') return ownerMenu;
  if (role === 'admin') return adminMenu;
  return karyawanMenu;
}

/** Kompatibilitas sementara untuk pemanggil lama */
export function getMenuByIsAdmin(isAdmin: boolean): MenuItem[] {
  return isAdmin ? ownerMenu : karyawanMenu;
}
