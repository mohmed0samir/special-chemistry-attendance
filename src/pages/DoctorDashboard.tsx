import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Clock, Users, Play, PowerOff, QrCode,
  MapPin, Calendar, CheckCircle2, XCircle, Download, RefreshCw, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttendanceSession, AttendanceRecord, Student } from '../types';
import { api } from '../lib/api';
import { exportToExcel, exportToCSV } from '../lib/excel-helpers';
import { QRModal } from '../components/QRModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const DoctorDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { doctorProfile } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [activeRecords, setActiveRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedGroupToStart, setSelectedGroupToStart] = useState<string>('1');

  // Load doctor's data
  const fetchDoctorData = async () => {
    if (!doctorProfile) return;
    setLoading(true);

    try {
      const data = await api.getAdminData();
      const mySessions = data.attendanceSessions.filter((s) => s.doctorId === doctorProfile.id);
      setSessions(mySessions);

      const openOne = mySessions.find((s) => s.status === 'OPEN');
      setActiveSession(openOne || null);

      if (openOne) {
        const cleanGrp = openOne.groupNumber.replace(/^مجموعة\s*/, '').trim();
        const students = data.students.filter((st) => st.groupNumber === cleanGrp);
        setGroupStudents(students);

        const recsRes = await api.getSessionRecords(openOne.id);
        setActiveRecords(recsRes.records);
      }
    } catch (err) {
      console.error('Error fetching doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(fetchDoctorData, 3000);
    return () => clearInterval(interval);
  }, [doctorProfile?.id]);

  // Start new Attendance Session
  const handleStartSession = async () => {
    if (!doctorProfile) return;

    try {
      const res = await api.startDoctorSession(doctorProfile.id, selectedGroupToStart);
      setActiveSession(res.session);
      setIsQRModalOpen(true);
      fetchDoctorData();
    } catch (err: any) {
      console.error('Error starting session:', err);
    }
  };

  // Close session
  const handleCloseSession = async (sessionId: string) => {
    try {
      await api.closeDoctorSession(sessionId);
      setActiveSession(null);
      fetchDoctorData();
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  // Export report for doctor
  const handleExportDoctorReport = (format: 'xlsx' | 'csv') => {
    if (!activeSession) return;
    const attendeeIds = new Set(activeRecords.map((r) => r.studentId));

    const exportRows = groupStudents.map((st, i) => {
      const isPresent = attendeeIds.has(st.id) || attendeeIds.has(st.studentId);
      const rec = activeRecords.find((r) => r.studentId === st.id || r.studentId === st.studentId);
      return {
        'م': i + 1,
        'اسم الطالب': st.name,
        'رقم الطالب': st.studentId,
        'المجموعة': `مجموعة ${st.groupNumber}`,
        'المادة': activeSession.courseName,
        'التاريخ': activeSession.date,
        'الحالة': isPresent ? 'حاضر' : 'غائب',
        'وقت الحضور': rec?.checkInTime || '-',
      };
    });

    const filename = `كشف_حضور_وغياب_${doctorProfile?.courseCode}_مجموعة_${activeSession.groupNumber}_${activeSession.date}`;
    if (format === 'xlsx') {
      exportToExcel(exportRows, filename, 'الحضور والغياب');
    } else {
      exportToCSV(exportRows, filename);
    }
  };

  const doctorGroups = doctorProfile?.groupNumbers
    ? doctorProfile.groupNumbers.split(',').map((g) => g.trim())
    : ['1', '2', '3'];

  // Absent students calculation
  const attendeeIds = new Set(activeRecords.map((r) => r.studentId));
  const absentStudents = groupStudents.filter((s) => !attendeeIds.has(s.id) && !attendeeIds.has(s.studentId));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Welcome Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xl">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span className="text-xs font-bold text-teal-400 tracking-wider">لوحة المحاضر</span>
            </div>
            <h1 className="text-2xl font-black text-white">{doctorProfile?.name || 'عضو هيئة التدريس'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              مقرر: {doctorProfile?.courseName} ({doctorProfile?.courseCode}) • {doctorProfile?.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-teal-400" />
            <span>تغيير كلمة المرور</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Session Controller & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Session Controller (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <span>جلسة تسجيل الحضور الحالية</span>
              </h2>
              {activeSession && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>جلسة مفتوحة</span>
                </span>
              )}
            </div>

            {activeSession ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeSession.courseName}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      مجموعة {activeSession.groupNumber} • بدأت: {activeSession.startTime}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-400 block">الحضور الآن:</span>
                    <span className="text-xl font-black text-emerald-400">
                      {activeRecords.length} / {groupStudents.length || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>عرض رمز الـ QR على الشاشة للطلاب</span>
                  </button>
                  <button
                    onClick={() => handleCloseSession(activeSession.id)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>إنهاء الحضور 🔒</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  ابدأ تسجيل الحضور للمحاضرة الآن. سيتم توليد رمز QR ديناميكي يتغير دورياً لحماية الحضور، مع تفعيل التحقق من موقع القاعة.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      اختر المجموعة / السكشن:
                    </label>
                    <select
                      value={selectedGroupToStart}
                      onChange={(e) => setSelectedGroupToStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    >
                      {doctorGroups.map((g) => (
                        <option key={g} value={g}>
                          مجموعة {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleStartSession}
                    className="flex items-center justify-center gap-2 sm:self-end px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition-all h-[42px]"
                  >
                    <Play className="w-4 h-4" />
                    <span>بدء تسجيل الحضور</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendees vs Absentees Live View */}
          {activeSession && (
            <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>الحاضرون ({activeRecords.length})</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <XCircle className="w-4 h-4" />
                    <span>الغائبون ({absentStudents.length})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportDoctorReport('xlsx')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    title="تصدير كشف كامل"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {/* Present List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">كشف الحضور:</span>
                  {activeRecords.map((rec) => (
                    <div
                      key={rec.attendanceId}
                      className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-200">{rec.studentName}</span>
                      <span className="font-mono text-[10px] text-emerald-400">{rec.checkInTime}</span>
                    </div>
                  ))}
                  {activeRecords.length === 0 && (
                    <p className="text-[11px] text-slate-500 text-center py-4">في انتظار تسجيل الطلاب...</p>
                  )}
                </div>

                {/* Absent List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الطلاب الذين لم يحضروا بعد:</span>
                  {absentStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs opacity-75"
                    >
                      <span className="text-slate-400">{st.name}</span>
                      <span className="text-[10px] text-rose-400">غائب</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Lecture Schedule and Past Sessions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Lecture Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>جدول المحاضرات الخاص بي</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">المقرر:</span>
                <span className="font-bold text-slate-200">{doctorProfile?.courseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">كود المقرر:</span>
                <span className="font-mono font-bold text-teal-400">{doctorProfile?.courseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المجموعات:</span>
                <span className="text-slate-300">{doctorProfile?.groupNumbers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الأيام والمواعيد:</span>
                <span className="text-slate-300">{doctorProfile?.days} ({doctorProfile?.startTime} - {doctorProfile?.endTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مكان المحاضرة:</span>
                <span className="text-slate-300">{doctorProfile?.location}</span>
              </div>
            </div>
          </div>

          {/* Past Sessions List */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">سجل الجلسات السابقة</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.filter(s => s.status === 'CLOSED').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">لا توجد جلسات مغلقة سابقة.</p>
              ) : (
                sessions
                  .filter((s) => s.status === 'CLOSED')
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-300">مجموعة {s.groupNumber}</p>
                        <p className="text-[10px] text-slate-500">{s.date} • {s.startTime}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        مغلقة 🔒
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Live QR Modal */}
      {activeSession && (
        <QRModal
          session={activeSession}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          onSessionClosed={() => {
            setActiveSession(null);
            fetchDoctorData();
          }}
        />
      )}

      {/* 2. Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
