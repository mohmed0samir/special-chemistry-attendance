import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, BookOpen, Layers, Calendar, Clock,
  BarChart3, Settings, Shield, Plus, Search, Filter, Trash2,
  Edit2, Upload, Download, Check, Copy, AlertTriangle, CheckCircle2,
  Lock, RefreshCw, KeyRound, MapPin, PowerOff, UserCheck, UserX
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Student, DoctorProfile, Course, Group, Schedule,
  AttendanceSession, AttendanceRecord, SystemSetting
} from '../types';
import { createDoctorAccount, resetDoctorPassword, generateDoctorPassword } from '../lib/auth-helpers';
import { exportToExcel, exportToCSV } from '../lib/excel-helpers';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { QRModal } from '../components/QRModal';

type ActiveTab =
  | 'overview'
  | 'students'
  | 'doctors'
  | 'courses'
  | 'groups'
  | 'schedules'
  | 'attendance'
  | 'reports'
  | 'settings';

export const AdminDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { adminProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Core Data Lists
  const [students, setStudents] = useState<Student[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<SystemSetting>({
    collegeName: 'كلية العلوم - شعبة كيمياء خاصة Special Chemistry',
    academicYear: '2026/2027',
    sessionDurationMinutes: 15,
    defaultRadius: 80,
    defaultLatitude: 30.0444,
    defaultLongitude: 31.2357,
  });

  const [loading, setLoading] = useState(true);

  // Modals & Popups
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedSessionForQR, setSelectedSessionForQR] = useState<AttendanceSession | null>(null);

  // Doctor Credentials Notification Modal
  const [createdDocCredentials, setCreatedDocCredentials] = useState<{
    name: string;
    courseName: string;
    courseCode: string;
    loginEmail: string;
    password: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Student Filter & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

  // Add/Edit Student Form Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState<{ id?: string; studentId: string; name: string; groupNumber: string }>({
    studentId: '',
    name: '',
    groupNumber: '1',
  });

  // Add Doctor Form Modal
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [docFormData, setDocFormData] = useState({
    name: '',
    courseName: 'Special Chemistry 203',
    courseCode: '203',
    groupNumbers: '1, 2, 3',
    days: 'الأحد، الثلاثاء',
    startTime: '09:00',
    endTime: '11:00',
    location: 'مدرج الكيمياء الرئيسي',
  });
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Add Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    doctorName: '',
    groupNumbers: '1, 2, 3',
  });

  // Report filters
  const [reportType, setReportType] = useState<'student' | 'group' | 'course' | 'doctor'>('group');
  const [reportFilterValue, setReportFilterValue] = useState('');

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminData();
      setStudents(data.students || []);
      setDoctors(data.doctors || []);
      setCourses(data.courses || []);
      setGroups(data.groups || []);
      setSchedules(data.schedules || []);
      const sessList = [...(data.attendanceSessions || [])];
      sessList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSessions(sessList);
      setRecords(data.attendanceRecords || []);
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Student CRUD handlers
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.name.trim() || !studentFormData.groupNumber.trim()) return;

    try {
      const cleanGroup = studentFormData.groupNumber.replace(/^مجموعة\s*/, '').trim();
      if (studentFormData.id) {
        // Update
        await api.updateStudent(studentFormData.id, {
          name: studentFormData.name.trim(),
          groupNumber: cleanGroup,
        });
        showToast('تم تعديل بيانات الطالب بنجاح ✅');
      } else {
        // Create
        await api.createStudent({
          studentId: studentFormData.studentId.trim() || `STU-${Date.now().toString(36).toUpperCase()}`,
          name: studentFormData.name.trim(),
          groupNumber: cleanGroup,
        });
        showToast('تمت إضافة الطالب بنجاح ✅');
      }
      setIsStudentModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('حدث خطأ أثناء حفظ بيانات الطالب.', 'error');
    }
  };

  const handleToggleStudentStatus = async (student: Student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateStudent(student.id, {
        status: newStatus,
      });
      showToast(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} حساب الطالب بنجاح`);
      fetchData();
    } catch {
      showToast('حدث خطأ أثناء تحديث حالة الطالب.', 'error');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await api.deleteStudent(studentId);
      showToast('تم حذف الطالب من قاعدة البيانات بنجاح');
      fetchData();
    } catch {
      showToast('حدث خطأ أثناء الحذف.', 'error');
    }
  };

  // Doctor Creation Handler
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoctor(true);
    try {
      const result = await createDoctorAccount({
        name: docFormData.name,
        courseName: docFormData.courseName,
        courseCode: docFormData.courseCode,
        groupNumbers: docFormData.groupNumbers,
        days: docFormData.days,
        startTime: docFormData.startTime,
        endTime: docFormData.endTime,
        location: docFormData.location,
      });

      // Show credentials modal with one-time password & copy button
      setCreatedDocCredentials({
        name: result.doctor.name,
        courseName: result.doctor.courseName,
        courseCode: result.doctor.courseCode,
        loginEmail: result.loginEmail,
        password: result.rawPassword,
      });

      setIsDoctorModalOpen(false);
      setDocFormData({
        name: '',
        courseName: 'Special Chemistry 203',
        courseCode: '203',
        groupNumbers: '1, 2, 3',
        days: 'الأحد، الثلاثاء',
        startTime: '09:00',
        endTime: '11:00',
        location: 'مدرج الكيمياء الرئيسي',
      });
      fetchData();
      showToast('تم إنشاء حساب الدكتور بنجاح ✅');
    } catch (err: any) {
      showToast('حدث خطأ أثناء إنشاء حساب الدكتور. حاول مرة أخرى.', 'error');
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleResetDoctorPassword = async (doctor: DoctorProfile) => {
    const generated = generateDoctorPassword(doctor.courseCode);
    setCreatedDocCredentials({
      name: doctor.name,
      courseName: doctor.courseName,
      courseCode: doctor.courseCode,
      loginEmail: doctor.email,
      password: generated,
    });
    showToast('تم توليد كلمة مرور جديدة للدكتور ✅');
  };

  // Course Handlers
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseFormData.name || !courseFormData.code) return;

    try {
      await api.createCourse({
        name: courseFormData.name.trim(),
        code: courseFormData.code.trim(),
        doctorName: courseFormData.doctorName.trim(),
        groupNumbers: courseFormData.groupNumbers.trim(),
      });
      setIsCourseModalOpen(false);
      setCourseFormData({ name: '', code: '', doctorName: '', groupNumbers: '1, 2, 3' });
      fetchData();
      showToast('تمت إضافة المادة بنجاح ✅');
    } catch {
      showToast('حدث خطأ أثناء إضافة المادة.', 'error');
    }
  };

  // Close Session
  const handleCloseSession = async (sessionId: string) => {
    try {
      await api.closeDoctorSession(sessionId);
      showToast('تم إغلاق جلسة الحضور 🔒');
      fetchData();
    } catch {
      showToast('حدث خطأ أثناء إغلاق الجلسة.', 'error');
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(studentSearch.toLowerCase());
    const matchGroup =
      selectedGroupFilter === 'ALL' || s.groupNumber === selectedGroupFilter;
    return matchSearch && matchGroup;
  });

  // Calculate unique groups from students
  const availableGroups = Array.from(new Set(students.map((s) => s.groupNumber))).sort();

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/30'
              : 'bg-rose-900/90 text-rose-200 border-rose-500/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-400 tracking-wider">
              لوحة الإدارة الأكاديمية
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            شعبة Special Chemistry | الكيمياء الخاصة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            المشرف الأكاديمي: {adminProfile?.name || 'محمد سمير عبد الغاطي'} • متصل بقاعدة بيانات Cloud Firestore
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>تغيير كلمة المرور</span>
          </button>
          <button
            onClick={() => fetchData()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
          { id: 'students', label: 'الطلاب', count: students.length, icon: Users },
          { id: 'doctors', label: 'الدكاترة', count: doctors.length, icon: GraduationCap },
          { id: 'courses', label: 'المواد', count: courses.length, icon: BookOpen },
          { id: 'groups', label: 'المجموعات', count: availableGroups.length, icon: Layers },
          { id: 'schedules', label: 'الجدول', icon: Calendar },
          { id: 'attendance', label: 'الحضور المباشر', count: sessions.filter(s => s.status === 'OPEN').length, icon: Clock },
          { id: 'reports', label: 'التقارير والكشوفات', icon: Download },
          { id: 'settings', label: 'الإعدادات والأمان', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">عدد الطلاب</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{students.length}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {students.filter(s => s.status === 'active').length} طالب نشط
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">عدد الدكاترة</span>
                <GraduationCap className="w-5 h-5 text-teal-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{doctors.length}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">أعضاء هيئة التدريس</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">المواد الأكاديمية</span>
                <BookOpen className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{courses.length}</p>
              <span className="text-[11px] text-slate-400 mt-1 block">مقررات شعبة الكيمياء</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">جلسات الحضور المفتوحة</span>
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                {sessions.filter(s => s.status === 'OPEN').length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">جلسات نشطة الآن</span>
            </div>
          </div>

          {/* Quick Actions & Live Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Active Sessions */}
            <div className="lg:col-span-7 rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>جلسات الحضور الحالية والمفتوحة</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {sessions.filter(s => s.status === 'OPEN').length} جلسة
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {sessions.filter(s => s.status === 'OPEN').length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    لا توجد جلسات حضور مفتوحة حالياً. يستطيع الدكاترة بدء الجلسات من لوحاتهم.
                  </div>
                ) : (
                  sessions
                    .filter(s => s.status === 'OPEN')
                    .map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <h4 className="text-xs font-bold text-white">
                              {sess.courseName || sess.courseCode}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px]">
                              مجموعة {sess.groupNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            الدكتور: {sess.doctorName || 'هيئة التدريس'} • {sess.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedSessionForQR(sess)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                          >
                            عرض QR
                          </button>
                          <button
                            onClick={() => handleCloseSession(sess.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Recent Check-in Logs */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900/70 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>آخر عمليات الحضور المسجلة</span>
                </h3>
                <span className="text-xs text-slate-500">{records.length} عملية</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {records.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    لم يتم تسجيل عمليات حضور بعد.
                  </div>
                ) : (
                  records.slice(0, 10).map((r) => (
                    <div
                      key={r.attendanceId}
                      className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{r.studentName}</p>
                        <p className="text-[10px] text-slate-400">مجموعة {r.groupNumber}</p>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-mono text-emerald-400 block">{r.checkInTime}</span>
                        <span className="text-[9px] text-slate-500">{r.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Students Management */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            {/* Search and Group Filter */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم الطالب..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              </div>

              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">جميع المجموعات</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    مجموعة {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions: Add Student & Excel Upload */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStudentFormData({ studentId: '', name: '', groupNumber: '1' });
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إضافة طالب</span>
              </button>

              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                <Upload className="w-4 h-4" />
                <span>رفع Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => {
                  const data = students.map((s, i) => ({
                    'م': i + 1,
                    'اسم الطالب': s.name,
                    'رقم الطالب': s.studentId,
                    'المجموعة': `مجموعة ${s.groupNumber}`,
                    'الحالة': s.status === 'active' ? 'نشط' : 'معطّل',
                  }));
                  exportToExcel(data, `كشف_طلاب_Special_Chemistry_${new Date().toISOString().split('T')[0]}`);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="تصدير كشف الطلاب إلى Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">اسم الطالب</th>
                    <th className="p-3.5">رقم الطالب</th>
                    <th className="p-3.5">المجموعة</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                        لا يوجد طلاب مطابقين للبحث. يمكنك إضافة طالب أو رفع كشف Excel.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3.5 font-bold text-slate-200">{st.name}</td>
                        <td className="p-3.5 font-mono text-slate-400">{st.studentId}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                            مجموعة {st.groupNumber}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              st.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {st.status === 'active' ? 'نشط' : 'معطّل'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setStudentFormData({
                                  id: st.id,
                                  studentId: st.studentId,
                                  name: st.name,
                                  groupNumber: st.groupNumber,
                                });
                                setIsStudentModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStudentStatus(st)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                st.status === 'active'
                                  ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                              }`}
                              title={st.status === 'active' ? 'تعطيل الطالب' : 'تفعيل الطالب'}
                            >
                              {st.status === 'active' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Doctors Management */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-white text-sm">أعضاء هيئة التدريس والمحاضرين</h3>
              <p className="text-xs text-slate-400">
                إدارة حسابات الدكاترة ومقرراتهم الدراسية وتوليد كلمات المرور الآمنة (صيغة CH + Code + Random)
              </p>
            </div>
            <button
              onClick={() => setIsDoctorModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دكتور جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.length === 0 ? (
              <div className="col-span-2 text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
                لم يتم تسجيل دكاترة بعد. اضغط "إضافة دكتور جديد" لبدء التسجيل.
              </div>
            ) : (
              doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{doc.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{doc.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResetDoctorPassword(doc)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                      title="إعادة إنشاء كلمة مرور جديدة للدكتور"
                    >
                      <RefreshCw className="w-3 h-3 text-teal-400" />
                      <span>Reset Password</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[10px]">المادة:</span>
                      <span className="font-semibold text-slate-200">{doc.courseName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">كود المادة:</span>
                      <span className="font-mono font-bold text-teal-400">{doc.courseCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">المجموعات:</span>
                      <span className="text-slate-300">{doc.groupNumbers}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">الأيام والمواعيد:</span>
                      <span className="text-slate-300">{doc.days} ({doc.startTime} - {doc.endTime})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{doc.location}</span>
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                      حساب مفعّل
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-white text-sm">المقررات الدراسية</h3>
              <p className="text-xs text-slate-400">مقررات شعبة الكيمياء الخاصة Special Chemistry</p>
            </div>
            <button
              onClick={() => setIsCourseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {courses.length === 0 ? (
              <div className="col-span-3 text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
                لم يتم إدخال مقررات بعد.
              </div>
            ) : (
              courses.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      كود: {c.code}
                    </span>
                    <BookOpen className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white">{c.name}</h4>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>الدكتور: {c.doctorName || 'غير محدد'}</p>
                    <p>المجموعات: {c.groupNumbers}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Groups */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold text-white text-sm">مجموعات وسكاشن الدفعة</h3>
            <p className="text-xs text-slate-400">إحصائيات توزيع الطلاب على المجموعات الأكاديمية</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {availableGroups.length === 0 ? (
              <div className="col-span-3 text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
                لم يتم تسجيل مجموعات بعد. سيتم إنشاؤها تلقائياً عند إضافة الطلاب أو رفع كشف Excel.
              </div>
            ) : (
              availableGroups.map((grp) => {
                const count = students.filter((s) => s.groupNumber === grp).length;
                return (
                  <div key={grp} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">شعبة Special Chemistry</span>
                      <Layers className="w-4 h-4 text-slate-500" />
                    </div>
                    <h4 className="text-lg font-black text-white">مجموعة {grp}</h4>
                    <p className="text-xs text-slate-400">{count} طالب مسجل بهذه المجموعة</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold text-white text-sm">الجدول الدراسي للمحاضرات</h3>
            <p className="text-xs text-slate-400">مواعيد وأماكن محاضرات شعبة الكيمياء الخاصة</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">المادة</th>
                  <th className="p-3.5">الدكتور</th>
                  <th className="p-3.5">المجموعة</th>
                  <th className="p-3.5">اليوم</th>
                  <th className="p-3.5">التوقيت</th>
                  <th className="p-3.5">المكان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {doctors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-200">{d.courseName}</td>
                    <td className="p-3.5 text-slate-300">{d.name}</td>
                    <td className="p-3.5 text-slate-300">مجموعات: {d.groupNumbers}</td>
                    <td className="p-3.5 text-slate-300">{d.days}</td>
                    <td className="p-3.5 font-mono text-slate-400">{d.startTime} - {d.endTime}</td>
                    <td className="p-3.5 text-slate-300">{d.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. Live & Historical Attendance Sessions */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">سجل جلسات الحضور والغياب</h3>
              <p className="text-xs text-slate-400">متابعة الجلسات الفعالة والسابقة وتفاصيل الحضور</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono">
              إجمالي الجلسات: {sessions.length}
            </span>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
                لا توجد جلسات حضور مسجلة حتى الآن.
              </div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          sess.status === 'OPEN' ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-white">{sess.courseName || sess.courseCode}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[10px]">
                        مجموعة {sess.groupNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sess.status === 'OPEN'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sess.status === 'OPEN' ? 'مفتوحة الآن' : 'مغلقة 🔒'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>الدكتور: {sess.doctorName || 'هيئة التدريس'}</span>
                      <span>•</span>
                      <span>التاريخ: {sess.date}</span>
                      <span>•</span>
                      <span>{sess.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSessionForQR(sess)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      تفاصيل الجلسة والـ QR
                    </button>
                    {sess.status === 'OPEN' && (
                      <button
                        onClick={() => handleCloseSession(sess.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                      >
                        إغلاق
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. Reports & Exports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">استخراج وتصدير تقارير الحضور</h3>
            <p className="text-xs text-slate-400">
              يمكنك تصدير كشوفات حضور وغياب تفصيلية بصيغة Excel أو CSV مجاناً بالكامل دون أي رسوم خارجية.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const exportData = records.map((r, i) => ({
                    'م': i + 1,
                    'اسم الطالب': r.studentName,
                    'رقم الطالب': r.studentId,
                    'المجموعة': `مجموعة ${r.groupNumber}`,
                    'المادة': r.courseId,
                    'التاريخ': r.date,
                    'وقت التسجيل': r.checkInTime,
                    'الحالة': r.status,
                    'التحقق من الموقع': r.locationVerified ? 'معتمد' : 'غير معتمد',
                  }));
                  exportToExcel(exportData, `تقرير_الحضور_الشامل_Special_Chemistry`);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                <span>تصدير سجل الحضور العام (Excel)</span>
              </button>

              <button
                onClick={() => {
                  const exportData = records.map((r, i) => ({
                    'م': i + 1,
                    'اسم الطالب': r.studentName,
                    'رقم الطالب': r.studentId,
                    'المجموعة': `مجموعة ${r.groupNumber}`,
                    'التاريخ': r.date,
                    'وقت التسجيل': r.checkInTime,
                    'الحالة': r.status,
                  }));
                  exportToCSV(exportData, `تقرير_الحضور_الشامل_Special_Chemistry`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>تصدير CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. Settings & Security */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">إعدادات الأمان وحساب المشرف</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <span className="font-bold text-slate-200 block">اسم المشرف المعتمد</span>
                  <span className="text-slate-400">{adminProfile?.name || 'محمد سمير عبد الغاطي'}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ADMIN
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <span className="font-bold text-slate-200 block">كلمة المرور</span>
                  <span className="text-slate-400">مشفرة ومحمية عبر Firebase Authentication</span>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  تغيير كلمة المرور
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">إعدادات الشعبة والموقع الجغرافي</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">اسم الشعبة / الكلية</label>
                <input
                  type="text"
                  value={settings.collegeName}
                  onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نطاق الحضور الافتراضي (متر)</label>
                  <input
                    type="number"
                    value={settings.defaultRadius}
                    onChange={(e) => setSettings({ ...settings, defaultRadius: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">مدة الجلسة الافتراضية (دقيقة)</label>
                  <input
                    type="number"
                    value={settings.sessionDurationMinutes}
                    onChange={(e) => setSettings({ ...settings, sessionDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await api.saveSettings(settings);
                    showToast('تم حفظ الإعدادات بنجاح ✅');
                  } catch {
                    showToast('فشل حفظ الإعدادات', 'error');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all mt-2"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          showToast('تم استيراد الطلاب بنجاح ✅');
          fetchData();
        }}
      />

      {/* 2. Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* 3. QR Live Session Modal */}
      {selectedSessionForQR && (
        <QRModal
          session={selectedSessionForQR}
          isOpen={true}
          onClose={() => setSelectedSessionForQR(null)}
          onSessionClosed={() => {
            fetchData();
            showToast('تم إغلاق الجلسة 🔒');
          }}
        />
      )}

      {/* 4. One-Time Doctor Credentials Modal */}
      {createdDocCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">بيانات دخول الدكتور</h3>
                <p className="text-xs text-slate-400">احفظ أو انسخ كلمة المرور الآن؛ لن تظهر مرة أخرى</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">اسم الدكتور:</span>
                <span className="font-bold text-slate-200">{createdDocCredentials.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">المادة وكودها:</span>
                <span className="font-bold text-teal-400">{createdDocCredentials.courseName} ({createdDocCredentials.courseCode})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">اسم الدخول:</span>
                <span className="font-mono text-slate-300">{createdDocCredentials.name}</span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-400">كلمة المرور:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm bg-slate-900 px-2 py-0.5 rounded">
                  {createdDocCredentials.password}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const text = `بيانات دخول نظام Special Chemistry:\nالدكتور: ${createdDocCredentials.name}\nالمادة: ${createdDocCredentials.courseName}\nكلمة المرور: ${createdDocCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'تم نسخ البيانات بنجاح' : 'نسخ بيانات الدخول'}</span>
              </button>
              <button
                onClick={() => setCreatedDocCredentials(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add/Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              {studentFormData.id ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">اسم الطالب الرباعي</label>
                <input
                  type="text"
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                  placeholder="أدخل اسم الطالب"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رقم الطالب (اختياري)</label>
                <input
                  type="text"
                  value={studentFormData.studentId}
                  onChange={(e) => setStudentFormData({ ...studentFormData, studentId: e.target.value })}
                  placeholder="مثال: STU-1049"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">رقم المجموعة</label>
                <input
                  type="text"
                  value={studentFormData.groupNumber}
                  onChange={(e) => setStudentFormData({ ...studentFormData, groupNumber: e.target.value })}
                  placeholder="مثال: 1 أو 2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Doctor Modal */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">إضافة عضو هيئة تدريس / دكتور</h3>
            <p className="text-xs text-slate-400">
              سيتم إنشاء الحساب وتوليد كلمة مرور قوية تلقائياً بصيغة CH + كود المادة + جزء عشوائي
            </p>

            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">اسم الدكتور</label>
                <input
                  type="text"
                  value={docFormData.name}
                  onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                  placeholder="مثال: د. أحمد كمال"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">اسم المادة</label>
                  <input
                    type="text"
                    value={docFormData.courseName}
                    onChange={(e) => setDocFormData({ ...docFormData, courseName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">كود المادة</label>
                  <input
                    type="text"
                    value={docFormData.courseCode}
                    onChange={(e) => setDocFormData({ ...docFormData, courseCode: e.target.value })}
                    placeholder="مثال: 203"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">المجموعة / المجموعات المسؤولة</label>
                <input
                  type="text"
                  value={docFormData.groupNumbers}
                  onChange={(e) => setDocFormData({ ...docFormData, groupNumbers: e.target.value })}
                  placeholder="مثال: 1, 2, 3"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">الأيام</label>
                <input
                  type="text"
                  value={docFormData.days}
                  onChange={(e) => setDocFormData({ ...docFormData, days: e.target.value })}
                  placeholder="مثال: الأحد، الأربعاء"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">وقت البداية</label>
                  <input
                    type="text"
                    value={docFormData.startTime}
                    onChange={(e) => setDocFormData({ ...docFormData, startTime: e.target.value })}
                    placeholder="09:00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">وقت النهاية</label>
                  <input
                    type="text"
                    value={docFormData.endTime}
                    onChange={(e) => setDocFormData({ ...docFormData, endTime: e.target.value })}
                    placeholder="11:00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">مكان المحاضرة / المعمل</label>
                <input
                  type="text"
                  value={docFormData.location}
                  onChange={(e) => setDocFormData({ ...docFormData, location: e.target.value })}
                  placeholder="مدرج الكيمياء الرئيسي"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-teal-600/20"
                >
                  {savingDoctor ? 'جاري الإنشاء والتفعيل...' : 'إنشاء حساب الدكتور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Add Course Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">إضافة مادة أكاديمية جديدة</h3>
            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">اسم المادة</label>
                <input
                  type="text"
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                  placeholder="مثال: Special Chemistry 203"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">كود المادة</label>
                <input
                  type="text"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                  placeholder="مثال: 203"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">الدكتور المسؤول</label>
                <input
                  type="text"
                  value={courseFormData.doctorName}
                  onChange={(e) => setCourseFormData({ ...courseFormData, doctorName: e.target.value })}
                  placeholder="اسم الدكتور"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
