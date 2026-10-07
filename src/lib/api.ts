import {
  AdminProfile, DoctorProfile, Student, Course, Group, Schedule,
  AttendanceSession, AttendanceRecord, SystemSetting
} from '../types';

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم.');
  }

  return data as T;
}

export const api = {
  // Auth
  adminLogin: (name: string, password: string) =>
    apiRequest<{ success: boolean; user: AdminProfile }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),

  adminChangePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean }>('/api/auth/admin-change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  doctorLogin: (name: string, password: string) =>
    apiRequest<{ success: boolean; doctor: DoctorProfile }>('/api/auth/doctor-login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),

  doctorChangePassword: (doctorId: string, currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean }>('/api/auth/doctor-change-password', {
      method: 'POST',
      body: JSON.stringify({ doctorId, currentPassword, newPassword }),
    }),

  studentLogin: (name: string, groupNumber: string) =>
    apiRequest<{ success: boolean; student: Student }>('/api/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ name, groupNumber }),
    }),

  // Admin Data
  getAdminData: () =>
    apiRequest<{
      students: Student[];
      doctors: DoctorProfile[];
      courses: Course[];
      groups: Group[];
      schedules: Schedule[];
      attendanceSessions: AttendanceSession[];
      attendanceRecords: AttendanceRecord[];
      settings: SystemSetting;
    }>('/api/admin/data'),

  createDoctor: (data: {
    name: string;
    courseName: string;
    courseCode: string;
    groupNumbers: string;
    days: string;
    startTime: string;
    endTime: string;
    location: string;
  }) =>
    apiRequest<{ success: boolean; doctor: DoctorProfile; rawPassword: string }>(
      '/api/admin/doctors',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  resetDoctorPassword: (doctorId: string) =>
    apiRequest<{ success: boolean; newPassword: string }>(
      `/api/admin/doctors/${doctorId}/reset-password`,
      { method: 'POST' }
    ),

  createStudent: (student: { studentId: string; name: string; groupNumber: string }) =>
    apiRequest<{ success: boolean; student: Student }>('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(student),
    }),

  updateStudent: (id: string, data: Partial<Student>) =>
    apiRequest<{ success: boolean; student: Student }>(`/api/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/admin/students/${id}`, {
      method: 'DELETE',
    }),

  importStudents: (students: { studentId: string; name: string; groupNumber: string }[]) =>
    apiRequest<{ success: boolean; count: number }>('/api/admin/students/import', {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  createCourse: (course: { name: string; code: string; doctorName: string; groupNumbers: string }) =>
    apiRequest<{ success: boolean; course: Course }>('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    }),

  saveSettings: (settings: SystemSetting) =>
    apiRequest<{ success: boolean; settings: SystemSetting }>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  // Doctor Sessions
  startDoctorSession: (doctorId: string, groupNumber: string) =>
    apiRequest<{ success: boolean; session: AttendanceSession }>('/api/doctor/sessions', {
      method: 'POST',
      body: JSON.stringify({ doctorId, groupNumber }),
    }),

  rotateSessionToken: (sessionId: string) =>
    apiRequest<{ success: boolean; token: string }>(`/api/doctor/sessions/${sessionId}/rotate-token`, {
      method: 'PUT',
    }),

  closeDoctorSession: (sessionId: string) =>
    apiRequest<{ success: boolean }>(`/api/doctor/sessions/${sessionId}/close`, {
      method: 'PUT',
    }),

  getSessionRecords: (sessionId: string) =>
    apiRequest<{ records: AttendanceRecord[] }>(`/api/doctor/sessions/${sessionId}/records`),

  // Student
  getStudentSessions: (groupNumber: string) =>
    apiRequest<{ sessions: AttendanceSession[] }>(`/api/student/sessions?group=${encodeURIComponent(groupNumber)}`),

  getStudentRecords: (studentId: string) =>
    apiRequest<{ records: AttendanceRecord[] }>(`/api/student/records/${encodeURIComponent(studentId)}`),

  studentCheckIn: (data: {
    sessionId: string;
    studentId: string;
    studentName: string;
    groupNumber: string;
    latitude?: number;
    longitude?: number;
  }) =>
    apiRequest<{ success: boolean; message: string; record: AttendanceRecord }>(
      '/api/student/check-in',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};
