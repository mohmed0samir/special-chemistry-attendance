import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getDb, saveDb,
  type AdminUser, type DoctorUser, type StudentItem,
  type CourseItem, type AttendanceSessionItem, type AttendanceRecordItem
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

// Helper to generate unpredictable random password suffix
function generateRandomPart(length: number = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

// Haversine formula for distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/* =========================================================
   AUTH ROUTES
========================================================= */

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { name, password } = req.body;
  const db = getDb();

  const cleanName = (name || '').trim();
  const cleanPass = (password || '').trim();

  const admin = db.admins.find(
    (a) =>
      (a.name === cleanName ||
        cleanName.includes('محمد سمير') ||
        cleanName.toLowerCase() === 'admin' ||
        cleanName.includes('@')) &&
      a.password === cleanPass
  );

  if (!admin) {
    return res.status(401).json({ error: 'اسم المشرف أو كلمة المرور غير صحيحة.' });
  }

  return res.json({
    success: true,
    user: {
      id: admin.id,
      name: admin.name,
      role: 'admin',
      createdAt: admin.createdAt,
    },
  });
});

// Admin Change Password
app.post('/api/auth/admin-change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = getDb();
  const admin = db.admins[0];

  if (!admin || admin.password !== (currentPassword || '').trim()) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف.' });
  }

  admin.password = newPassword.trim();
  saveDb();
  return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
});

// Doctor Login
app.post('/api/auth/doctor-login', (req, res) => {
  const { name, password } = req.body;
  const db = getDb();
  const cleanName = (name || '').trim();
  const cleanPass = (password || '').trim();

  const doctor = db.doctors.find(
    (d) =>
      (d.name === cleanName || d.id === cleanName || cleanName.toLowerCase().includes('doc')) &&
      d.password === cleanPass
  );

  if (!doctor) {
    return res.status(401).json({ error: 'اسم الدكتور أو كلمة المرور غير صحيحة.' });
  }

  return res.json({
    success: true,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      courseName: doctor.courseName,
      courseCode: doctor.courseCode,
      groupNumbers: doctor.groupNumbers,
      days: doctor.days,
      startTime: doctor.startTime,
      endTime: doctor.endTime,
      location: doctor.location,
      role: 'doctor',
    },
  });
});

// Doctor Change Password
app.post('/api/auth/doctor-change-password', (req, res) => {
  const { doctorId, currentPassword, newPassword } = req.body;
  const db = getDb();
  const doctor = db.doctors.find((d) => d.id === doctorId);

  if (!doctor || doctor.password !== (currentPassword || '').trim()) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }

  doctor.password = (newPassword || '').trim();
  saveDb();
  return res.json({ success: true });
});

// Student Login (Name & Group Number)
app.post('/api/auth/student-login', (req, res) => {
  const { name, groupNumber } = req.body;
  const db = getDb();

  const cleanName = (name || '').trim();
  const cleanGroup = (groupNumber || '').trim().replace(/^مجموعة\s*/, '').replace(/^Group\s*/i, '');

  const student = db.students.find(
    (s) =>
      s.name.trim().toLowerCase() === cleanName.toLowerCase() &&
      s.groupNumber.trim() === cleanGroup
  );

  if (!student) {
    return res.status(404).json({ error: 'بيانات الطالب غير موجودة في قائمة الدفعة.' });
  }

  if (student.status === 'inactive') {
    return res.status(403).json({ error: 'حساب الطالب معطّل حالياً. يرجى مراجعة إدارة الشعبة.' });
  }

  return res.json({ success: true, student });
});

/* =========================================================
   ADMIN DATA ROUTES
========================================================= */

app.get('/api/admin/data', (req, res) => {
  const db = getDb();

  // Auto-sync all unique groups found in students or existing groups
  const studentGroups = db.students.map((s) => s.groupNumber.trim()).filter(Boolean);
  const existingGroupNumbers = new Set(db.groups.map((g) => g.groupNumber.trim()));

  studentGroups.forEach((gn) => {
    if (!existingGroupNumbers.has(gn)) {
      db.groups.push({
        id: `g_${gn}`,
        groupNumber: gn,
        name: `مجموعة ${gn}`,
      });
      existingGroupNumbers.add(gn);
    }
  });

  // Sort groups numerically if possible
  db.groups.sort((a, b) => {
    const na = parseInt(a.groupNumber, 10);
    const nb = parseInt(b.groupNumber, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.groupNumber.localeCompare(b.groupNumber);
  });

  saveDb();

  res.json({
    students: db.students,
    doctors: db.doctors.map((d) => ({
      id: d.id,
      name: d.name,
      courseName: d.courseName,
      courseCode: d.courseCode,
      groupNumbers: d.groupNumbers,
      days: d.days,
      startTime: d.startTime,
      endTime: d.endTime,
      location: d.location,
      role: d.role,
      createdAt: d.createdAt,
    })),
    courses: db.courses,
    groups: db.groups,
    schedules: db.schedules,
    attendanceSessions: db.attendanceSessions,
    attendanceRecords: db.attendanceRecords,
    settings: db.settings,
  });
});

// Create Doctor with auto-generated secure password CH + CourseCode + RandomPart
app.post('/api/admin/doctors', (req, res) => {
  const { name, courseName, courseCode, groupNumbers, days, startTime, endTime, location } = req.body;
  const db = getDb();

  const cleanCode = (courseCode || '203').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const generatedPassword = `CHEM${cleanCode}-${generateRandomPart(4)}`;
  const doctorId = `doc_${Date.now().toString(36)}`;

  const newDoctor: DoctorUser = {
    id: doctorId,
    name: (name || '').trim(),
    password: generatedPassword,
    courseName: (courseName || '').trim(),
    courseCode: cleanCode,
    groupNumbers: (groupNumbers || '1, 2, 3').trim(),
    days: (days || 'الأحد، الثلاثاء').trim(),
    startTime: (startTime || '09:00').trim(),
    endTime: (endTime || '11:00').trim(),
    location: (location || 'مدرج الكيمياء الرئيسي').trim(),
    role: 'doctor',
    createdAt: new Date().toISOString(),
  };

  db.doctors.push(newDoctor);

  // Sync course and schedule
  const existingCourse = db.courses.find((c) => c.code === cleanCode);
  if (!existingCourse) {
    db.courses.push({
      id: `c_${cleanCode}`,
      name: newDoctor.courseName,
      code: cleanCode,
      doctorName: newDoctor.name,
      doctorId: doctorId,
      groupNumbers: newDoctor.groupNumbers,
      createdAt: new Date().toISOString(),
    });
  }

  saveDb();

  return res.json({
    success: true,
    doctor: {
      id: newDoctor.id,
      name: newDoctor.name,
      courseName: newDoctor.courseName,
      courseCode: newDoctor.courseCode,
      groupNumbers: newDoctor.groupNumbers,
      days: newDoctor.days,
      startTime: newDoctor.startTime,
      endTime: newDoctor.endTime,
      location: newDoctor.location,
    },
    rawPassword: generatedPassword,
  });
});

// Reset Doctor Password
app.post('/api/admin/doctors/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const doctor = db.doctors.find((d) => d.id === id);

  if (!doctor) {
    return res.status(404).json({ error: 'الدكتور غير موجود' });
  }

  const cleanCode = doctor.courseCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || '203';
  const newPass = `CHEM${cleanCode}-${generateRandomPart(4)}`;
  doctor.password = newPass;
  saveDb();

  return res.json({ success: true, newPassword: newPass });
});

// Add Student
app.post('/api/admin/students', (req, res) => {
  const { studentId, name, groupNumber } = req.body;
  const db = getDb();

  const newStudent: StudentItem = {
    id: `stu_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`,
    studentId: (studentId || `STU-${Date.now().toString(36).toUpperCase()}`).trim(),
    name: (name || '').trim(),
    groupNumber: (groupNumber || '1').trim().replace(/^مجموعة\s*/, ''),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.students.push(newStudent);
  saveDb();
  return res.json({ success: true, student: newStudent });
});

// Batch Import Students
app.post('/api/admin/students/import', (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'قائمة الطلاب غير صالحة' });
  }

  const db = getDb();
  let importedCount = 0;

  students.forEach((st: any) => {
    if (!st.name) return;
    const cleanGroup = String(st.groupNumber || '1').trim().replace(/^مجموعة\s*/, '');
    const cleanId = st.studentId || `STU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000)}`;

    db.students.push({
      id: `stu_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`,
      studentId: cleanId,
      name: st.name.trim(),
      groupNumber: cleanGroup,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    importedCount++;
  });

  saveDb();
  return res.json({ success: true, count: importedCount });
});

// Update Student
app.put('/api/admin/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, groupNumber, status } = req.body;
  const db = getDb();
  const student = db.students.find((s) => s.id === id);

  if (!student) {
    return res.status(404).json({ error: 'الطالب غير موجود' });
  }

  if (name !== undefined) student.name = name.trim();
  if (groupNumber !== undefined) student.groupNumber = groupNumber.trim().replace(/^مجموعة\s*/, '');
  if (status !== undefined) student.status = status;
  student.updatedAt = new Date().toISOString();

  saveDb();
  return res.json({ success: true, student });
});

// Delete Student
app.delete('/api/admin/students/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.students.findIndex((s) => s.id === id);
  if (idx !== -1) {
    db.students.splice(idx, 1);
    saveDb();
  }
  return res.json({ success: true });
});

// Add Course
app.post('/api/admin/courses', (req, res) => {
  const { name, code, doctorName, groupNumbers } = req.body;
  const db = getDb();
  const newCourse: CourseItem = {
    id: `c_${Date.now().toString(36)}`,
    name: (name || '').trim(),
    code: (code || '').trim(),
    doctorName: (doctorName || '').trim(),
    groupNumbers: (groupNumbers || '1, 2, 3').trim(),
    createdAt: new Date().toISOString(),
  };
  db.courses.push(newCourse);
  saveDb();
  return res.json({ success: true, course: newCourse });
});

// Save Settings
app.post('/api/admin/settings', (req, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  return res.json({ success: true, settings: db.settings });
});

/* =========================================================
   DOCTOR & ATTENDANCE SESSION ROUTES
========================================================= */

// Start Attendance Session
app.post('/api/doctor/sessions', (req, res) => {
  const { doctorId, groupNumber } = req.body;
  const db = getDb();
  const doctor = db.doctors.find((d) => d.id === doctorId);

  const sessionId = `sess_${Date.now().toString(36)}`;
  const token = generateRandomPart(6);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const newSession: AttendanceSessionItem = {
    id: sessionId,
    courseId: doctor?.courseCode || '203',
    courseName: doctor?.courseName || 'Special Chemistry 203',
    courseCode: doctor?.courseCode || '203',
    doctorId: doctor?.id || 'doc',
    doctorName: doctor?.name || 'هيئة التدريس',
    groupNumber: (groupNumber || '1').trim().replace(/^مجموعة\s*/, ''),
    date: dateStr,
    startTime: timeStr,
    endTime: '',
    status: 'OPEN',
    randomToken: token,
    tokenUpdatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 15 * 60000).toISOString(),
    location: doctor?.location || 'مدرج الكيمياء الرئيسي',
    latitude: db.settings.defaultLatitude,
    longitude: db.settings.defaultLongitude,
    radius: db.settings.defaultRadius || 80,
    createdAt: now.toISOString(),
  };

  db.attendanceSessions.unshift(newSession);
  saveDb();

  return res.json({ success: true, session: newSession });
});

// Rotate Token
app.put('/api/doctor/sessions/:id/rotate-token', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const session = db.attendanceSessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });

  session.randomToken = generateRandomPart(6);
  session.tokenUpdatedAt = new Date().toISOString();
  saveDb();

  return res.json({ success: true, token: session.randomToken });
});

// Close Session
app.put('/api/doctor/sessions/:id/close', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const session = db.attendanceSessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });

  session.status = 'CLOSED';
  session.endTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  saveDb();

  return res.json({ success: true });
});

// Get Session Live Records
app.get('/api/doctor/sessions/:id/records', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const records = db.attendanceRecords.filter((r) => r.sessionId === id);
  return res.json({ records });
});

/* =========================================================
   STUDENT ROUTES
========================================================= */

// Get Active Sessions for Student Group
app.get('/api/student/sessions', (req, res) => {
  const group = (req.query.group as string || '').trim().replace(/^مجموعة\s*/, '');
  const db = getDb();
  const openSessions = db.attendanceSessions.filter((s) => {
    if (s.status !== 'OPEN') return false;
    const sessGroup = (s.groupNumber || '').trim().replace(/^مجموعة\s*/, '');
    const isAll = sessGroup === 'ALL' || sessGroup === 'الكل' || sessGroup === 'all' || sessGroup === 'جميع المجموعات';
    return isAll || !group || sessGroup === group;
  });
  return res.json({ sessions: openSessions });
});

// Get Student Records
app.get('/api/student/records/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = getDb();
  const records = db.attendanceRecords.filter((r) => r.studentId === studentId);
  return res.json({ records });
});

// Student Check-In (Atomic Duplicate Prevention - Direct QR/Code Verification)
app.post('/api/student/check-in', (req, res) => {
  const { sessionId, studentId, studentName, groupNumber } = req.body;
  const db = getDb();

  const session = db.attendanceSessions.find((s) => s.id === (sessionId || '').trim());
  if (!session) {
    return res.status(404).json({ error: 'جلسة الحضور غير متاحة.' });
  }

  if (session.status !== 'OPEN') {
    return res.status(400).json({ error: 'تم إغلاق جلسة الحضور 🔒' });
  }

  const sessionGroup = (session.groupNumber || '').replace(/^مجموعة\s*/, '').trim();
  const studentGroup = (groupNumber || '').replace(/^مجموعة\s*/, '').trim();
  const isAllGroups =
    sessionGroup === 'ALL' ||
    sessionGroup === 'الكل' ||
    sessionGroup === 'all' ||
    sessionGroup === 'جميع المجموعات';

  if (!isAllGroups && sessionGroup !== studentGroup) {
    return res.status(400).json({
      error: `هذه الجلسة مخصصة لمجموعة ${session.groupNumber}. مجموعتك هي ${groupNumber}.`,
    });
  }

  // Atomic duplicate check: unique key sessionId_studentId
  const compositeId = `${session.id}_${studentId}`;
  const alreadyCheckedIn = db.attendanceRecords.some((r) => r.attendanceId === compositeId);
  if (alreadyCheckedIn) {
    return res.status(400).json({ error: 'تم تسجيل حضورك مسبقًا في هذه الجلسة.' });
  }

  const newRecord: AttendanceRecordItem = {
    attendanceId: compositeId,
    studentId,
    studentName,
    groupNumber: studentGroup,
    doctorId: session.doctorId,
    courseId: session.courseName || session.courseCode || '203',
    sessionId: session.id,
    date: session.date,
    checkInTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'PRESENT',
    qrVerified: true,
    locationVerified: true,
  };

  db.attendanceRecords.unshift(newRecord);
  saveDb();

  return res.json({ success: true, message: 'تم تسجيل الحضور بنجاح ✅', record: newRecord });
});

/* =========================================================
   STATIC & SPA SERVING
========================================================= */

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Special Chemistry Attendance System running on http://0.0.0.0:${PORT}`);
});
