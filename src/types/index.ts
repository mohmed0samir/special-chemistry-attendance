export type UserRole = 'admin' | 'doctor' | 'student';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  courseId?: string;
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

export interface Student {
  id: string;
  studentId: string;
  name: string;
  groupNumber: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  doctorName?: string;
  doctorId?: string;
  groupNumbers: string;
  createdAt: string;
}

export interface Group {
  id: string;
  groupNumber: string;
  name: string;
  description?: string;
  studentCount?: number;
}

export interface Schedule {
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

export interface AttendanceSession {
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

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'REJECTED' | 'CANCELLED';

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  studentName: string;
  groupNumber: string;
  doctorId: string;
  courseId: string;
  sessionId: string;
  date: string;
  checkInTime: string;
  status: AttendanceStatus;
  qrVerified: boolean;
  locationVerified: boolean;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
}

export interface SystemSetting {
  collegeName: string;
  academicYear: string;
  sessionDurationMinutes: number;
  defaultRadius: number;
  defaultLatitude: number;
  defaultLongitude: number;
}
