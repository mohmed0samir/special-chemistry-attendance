import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface AdminUser {
  id: string;
  name: string;
  password: string;
  role: 'admin';
  createdAt: string;
}

export interface DoctorUser {
  id: string;
  name: string;
  password: string;
  courseName: string;
  courseCode: string;
  groupNumbers: string;
  days: string;
  startTime: string;
  endTime: string;
  location: string;
  role: 'doctor';
  createdAt: string;
}

export interface StudentItem {
  id: string;
  studentId: string;
  name: string;
  groupNumber: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CourseItem {
  id: string;
  name: string;
  code: string;
  doctorName?: string;
  doctorId?: string;
  groupNumbers: string;
  createdAt: string;
}

export interface GroupItem {
  id: string;
  groupNumber: string;
  name: string;
  description?: string;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  courseName?: string;
  doctorId: string;
  doctorName?: string;
  groupNumber: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface AttendanceSessionItem {
  id: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  doctorId: string;
  doctorName?: string;
  groupNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'OPEN' | 'CLOSED';
  randomToken: string;
  tokenUpdatedAt?: string;
  expiresAt?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  createdAt: string;
}

export interface AttendanceRecordItem {
  attendanceId: string;
  studentId: string;
  studentName: string;
  groupNumber: string;
  doctorId: string;
  courseId: string;
  sessionId: string;
  date: string;
  checkInTime: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'REJECTED' | 'CANCELLED';
  qrVerified: boolean;
  locationVerified: boolean;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
}

export interface SystemSettingItem {
  collegeName: string;
  academicYear: string;
  sessionDurationMinutes: number;
  defaultRadius: number;
  defaultLatitude: number;
  defaultLongitude: number;
}

export interface DatabaseSchema {
  admins: AdminUser[];
  doctors: DoctorUser[];
  students: StudentItem[];
  courses: CourseItem[];
  groups: GroupItem[];
  schedules: ScheduleItem[];
  attendanceSessions: AttendanceSessionItem[];
  attendanceRecords: AttendanceRecordItem[];
  settings: SystemSettingItem;
}

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin_primary',
  name: 'محمد سمير عبدالعاطي',
  password: 'Chemist 2030',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: SystemSettingItem = {
  collegeName: 'كلية العلوم - شعبة كيمياء خاصة Special Chemistry',
  academicYear: '2026/2027',
  sessionDurationMinutes: 15,
  defaultRadius: 80,
  defaultLatitude: 30.0444,
  defaultLongitude: 31.2357,
};

let inMemoryDb: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(content);
      // Ensure primary admin name is updated to exact requested name
      if (inMemoryDb?.admins) {
        const found = inMemoryDb.admins.find(a => a.name.includes('محمد سمير'));
        if (found) {
          found.name = 'محمد سمير عبدالعاطي';
        }
      }
      return inMemoryDb!;
    } catch (e) {
      console.error('Error reading database file, resetting to default', e);
    }
  }

  inMemoryDb = {
    admins: [DEFAULT_ADMIN],
    doctors: [],
    students: [],
    courses: [
      {
        id: 'c_203',
        name: 'Special Chemistry 203',
        code: '203',
        doctorName: 'هيئة التدريس',
        groupNumbers: '1, 2, 3',
        createdAt: new Date().toISOString(),
      },
    ],
    groups: [
      { id: 'g_1', groupNumber: '1', name: 'مجموعة 1' },
      { id: 'g_2', groupNumber: '2', name: 'مجموعة 2' },
      { id: 'g_3', groupNumber: '3', name: 'مجموعة 3' },
    ],
    schedules: [],
    attendanceSessions: [],
    attendanceRecords: [],
    settings: DEFAULT_SETTINGS,
  };

  saveDb();
  return inMemoryDb;
}

export function saveDb(): void {
  if (!inMemoryDb) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}
