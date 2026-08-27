export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'karyawan' | 'admin' | 'owner';
  phone?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  type: 'check_in' | 'check_out';
  photo_url?: string | null;
  photo_public_id?: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  is_within_geofence?: boolean;
  geofence_id?: string;
  notes?: string;
  is_late?: boolean;
  work_duration_minutes?: number | null;
  recorded_at: string;
  created_at: string;
  user?: User;
  geofence?: Geofence;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface AttendanceToday {
  has_check_in: boolean;
  has_check_out: boolean;
  check_in: Attendance | null;
  check_out: Attendance | null;
}

export interface DailyRecap {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  is_late: boolean;
  work_hours: number | null;
  check_in_photo: string | null;
  check_out_photo: string | null;
}

export interface MonthlySummary {
  total_days: number;
  present: number;
  late: number;
  absent: number;
  total_hours: number;
}

export interface DashboardData {
  today: {
    total_employees: number;
    checked_in: number;
    not_yet: number;
    late: number;
  };
  recent_attendance: (Attendance & { user: User })[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_by?: string | null;
  is_active: boolean;
  created_at: string;
  author?: Pick<User, 'full_name'> | null;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  type: 'cuti' | 'izin' | 'sakit';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  review_note?: string | null;
  attachment_url?: string | null;
  attachment_public_id?: string | null;
  created_at: string;
  user?: User | null;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  created_by?: string | null;
  created_at?: string;
}

export interface OvertimeRequest {
  id: string;
  user_id: string;
  work_date: string;
  planned_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  review_note?: string | null;
  created_at: string;
  user?: Pick<User, 'full_name' | 'role'> | null;
}
