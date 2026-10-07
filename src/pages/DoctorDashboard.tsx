import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Clock, Users, Play, PowerOff, QrCode,
  Calendar, Check, Download, KeyRound, Layers
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
  const [availableGroups, setAvailableGroups] = useState<{ value: string; label: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedGroupToStart, setSelectedGroupToStart] = useState<string>('ALL');

  // Load doctor's data and auto-detect all groups from students/database
  const fetchDoctorData = async () => {
    if (!doctorProfile) return;
    setLoading(true);

    try {
      const data = await api.getAdminData();
      const mySessions = data.attendanceSessions.filter((s) => s.doctorId === doctorProfile.id);
      setSessions(mySessions);

      // Auto-detect and group student count
      const groupCounts = new Map<string, number>();
      data.students.forEach((st) => {
        const g = (st.groupNumber || '').trim().replace(/^مجموعة\s*/, '') || '1';
        groupCounts.set(g, (groupCounts.get(g) || 0) + 1);
      });

      // Aggregate all groups from both db.groups and registered students
      const uniqueGroupKeys = Array.from(
        new Set([
          ...data.groups.map((g) => (g.groupNumber || '').trim().replace(/^مجموعة\s*/, '')),
          ...Array.from(groupCounts.keys()),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => {
          const na = parseInt(a, 10);
          const nb = parseInt(b, 10);
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          return a.localeCompare(b);
        });

      // Build options: All Groups first, then each individual group
      const groupsList: { value: string; label: string; count: number }[] = [
        {
          value: 'ALL',
          label: `الدفعة بالكامل (جميع المجموعات - ${data.students.length} طالب)`,
          count: data.students.length,
        },
        ...uniqueGroupKeys.map((gn) => ({
          value: gn,
          label: `مجموعة ${gn} (${groupCounts.get(gn) || 0} طالب)`,
          count: groupCounts.get(gn) || 0,
        })),
      ];

      setAvailableGroups(groupsList);

      const openOne = mySessions.find((s) => s.status === 'OPEN');
      setActiveSession(openOne || null);

      if (openOne) {
        const cleanGrp = openOne.groupNumber.replace(/^مجموعة\s*/, '').trim();
        const isAll =
          cleanGrp === 'ALL' ||
          cleanGrp === 'الكل' ||
          cleanGrp === 'all' ||
          cleanGrp === 'جميع المجموعات';

        const students = isAll
          ? data.students
          : data.students.filter((st) => (st.groupNumber || '').trim().replace(/^مجموعة\s*/, '') === cleanGrp);

        setGroupStudents(students);

        const recsRes = await api.getSessionRecords(openOne.id);
        setActiveRecords(recsRes.records || []);
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

    const grpName = activeSession.groupNumber === 'ALL' ? 'الدفعة_بالكامل' : `مجموعة_${activeSession.groupNumber}`;
    const filename = `كشف_حضور_${doctorProfile?.courseCode}_${grpName}_${activeSession.date}`;
    if (format === 'xlsx') {
      exportToExcel(exportRows, filename, 'الحضور والغياب');
    } else {
      exportToCSV(exportRows, filename);
    }
  };

  const attendeeIds = new Set(activeRecords.map((r) => r.studentId));
  const attendeeRecordsMap = new Map(activeRecords.map((r) => [r.studentId, r]));

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Editorial Profile Header */}
      <div className="rounded-2xl bg-[#0F1626] border border-white/[0.08] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-400 mb-0.5">
              <span>هيئة التدريس</span>
              <span aria-hidden="true">·</span>
              <span>{doctorProfile?.courseName} ({doctorProfile?.courseCode})</span>
              <span aria-hidden="true">·</span>
              <span>{doctorProfile?.location || 'مدرج الكيمياء الرئيسي'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">د. {doctorProfile?.name || 'عضو هيئة التدريس'}</h1>
          </div>
        </div>

        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/[0.08] transition-colors"
        >
          <KeyRound className="w-3.5 h-3.5 text-teal-400" />
          <span>تغيير كلمة المرور</span>
        </button>
      </div>

      {/* Main Grid: Active Session Control & Live Attendance Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Session Controller (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F1626] border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>جلسة تسجيل الحضور</span>
              </h2>
              {activeSession && (
                <span className="text-xs text-teal-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  <span>نشطة الآن</span>
                </span>
              )}
            </div>

            {activeSession ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{activeSession.courseName}</h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="text-teal-300 font-semibold">
                        {activeSession.groupNumber === 'ALL'
                          ? 'الدفعة بالكامل (جميع المجموعات)'
                          : `مجموعة ${activeSession.groupNumber}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">بدأت: {activeSession.startTime}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block">الحضور المسجل</span>
                    <span className="text-xl font-bold font-mono tabular-nums text-teal-400">
                      {activeRecords.length} / {groupStudents.length || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>عرض رمز الـ QR على الشاشة</span>
                  </button>
                  <button
                    onClick={() => handleCloseSession(activeSession.id)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs border border-rose-500/30 transition-colors"
                    title="إنهاء الجلسة وإغلاق الباب"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>إنهاء</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  اختر المجموعة المراد تسجيل حضورها (مجموعة واحدة محددة أو الدفعة بالكامل)، ثم ابدأ الجلسة لعرض كود الحضور.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>المجموعة المستهدفة:</span>
                    </label>
                    <select
                      value={selectedGroupToStart}
                      onChange={(e) => setSelectedGroupToStart(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {availableGroups.length === 0 ? (
                        <>
                          <option value="ALL">الدفعة بالكامل (جميع المجموعات)</option>
                          <option value="1">مجموعة 1</option>
                          <option value="2">مجموعة 2</option>
                        </>
                      ) : (
                        availableGroups.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <button
                    onClick={handleStartSession}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>بدء تسجيل حضور جديد</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Schedule card */}
          <div className="p-5 rounded-2xl bg-[#0F1626] border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>جدول المحاضرات الأسبوعي</span>
            </h3>
            <div className="text-xs text-slate-400 space-y-1.5 font-mono">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">الأيام المعتمدة:</span>
                <span className="text-slate-100">{doctorProfile?.days || 'الأحد، الثلاثاء'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">التوقيت:</span>
                <span className="text-slate-100">{doctorProfile?.startTime || '09:00'} — {doctorProfile?.endTime || '11:00'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-300">المكان:</span>
                <span className="text-slate-100">{doctorProfile?.location || 'مدرج الكيمياء الرئيسي'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Roster and Attendees (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-[#0F1626] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-white">كشف الحضور اللحظي للمحاضرة</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSession
                    ? `${
                        activeSession.groupNumber === 'ALL'
                          ? 'الدفعة بالكامل'
                          : `المجموعة: ${activeSession.groupNumber}`
                      } · إجمالي المسجلين: ${groupStudents.length}`
                    : 'في انتظار بدء الجلسة'}
                </p>
              </div>

              {activeSession && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportDoctorReport('xlsx')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 text-xs font-medium border border-teal-500/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExportDoctorReport('csv')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium border border-white/[0.08] transition-colors"
                  >
                    <span>CSV</span>
                  </button>
                </div>
              )}
            </div>

            {activeSession ? (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {groupStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    لا يوجد طلاب مسجلين في هذه المجموعة حالياً. قم بإضافتهم أو استيراد كشف Excel عبر لوحة المشرف.
                  </p>
                ) : (
                  groupStudents.map((st, i) => {
                    const isPresent = attendeeIds.has(st.id) || attendeeIds.has(st.studentId);
                    const rec = attendeeRecordsMap.get(st.id) || attendeeRecordsMap.get(st.studentId);

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                          isPresent
                            ? 'bg-teal-950/20 border-teal-500/30 text-white'
                            : 'bg-[#090D16] border-white/[0.04] text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono tabular-nums text-slate-500 w-5">
                            {i + 1}.
                          </span>
                          <div>
                            <span className="text-xs font-medium block text-slate-100">{st.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {st.studentId} · مجموعة {st.groupNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          {isPresent ? (
                            <div className="flex items-center gap-1.5 text-teal-400 font-medium">
                              <Check className="w-3.5 h-3.5" />
                              <span>حاضر ({rec?.checkInTime})</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs font-medium">لم يسجل بعد</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">اضغط على "بدء تسجيل حضور جديد" لعرض الكشف ومتابعة تسجيل الطلاب فوراً</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR MODAL */}
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

      {/* PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
