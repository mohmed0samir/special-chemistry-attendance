import React, { useState, useEffect } from 'react';
import { User, Check, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, AttendanceSession } from '../types';
import { api } from '../lib/api';
import { StudentCheckInModal } from '../components/StudentCheckInModal';

export const StudentDashboard: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { studentProfile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [openSessions, setOpenSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    if (!studentProfile) return;
    try {
      const recRes = await api.getStudentRecords(studentProfile.id);
      setRecords(recRes.records);

      const sessRes = await api.getStudentSessions(studentProfile.groupNumber);
      setOpenSessions(sessRes.sessions);
    } catch (err) {
      console.error('Error fetching student records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
    const interval = setInterval(fetchStudentData, 3000);
    return () => clearInterval(interval);
  }, [studentProfile?.id, studentProfile?.groupNumber]);

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const totalLecturesCount = Math.max(records.length, 1);
  const attendanceRatio = Math.round((presentCount / totalLecturesCount) * 100);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Student Welcome Header */}
      <div className="rounded-2xl bg-[#0F1626] border border-white/[0.08] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-400 mb-0.5">
              <span>شعبة Special Chemistry</span>
              <span aria-hidden="true">·</span>
              <span>مجموعة {studentProfile?.groupNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{studentProfile?.studentId}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{studentProfile?.name}</h1>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedSessionId(openSessions[0]?.id || '');
            setIsCheckInModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors"
        >
          <QrCode className="w-4 h-4" />
          <span>تسجيل الحضور في المحاضرة</span>
        </button>
      </div>

      {/* Active Live Sessions Banner */}
      {openSessions.length > 0 && (
        <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <h3 className="font-bold text-sm">هناك جلسة حضور نشطة الآن لمجموعتك!</h3>
            </div>
            <span className="text-xs font-mono text-teal-400">
              مفتوحة حالياً للتسجيل
            </span>
          </div>

          {openSessions.map((sess) => {
            const alreadyCheckedIn = records.some((r) => r.sessionId === sess.id);
            return (
              <div
                key={sess.id}
                className="p-4 rounded-xl bg-[#090D16] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{sess.courseName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>المحاضر: {sess.doctorName || 'هيئة التدريس'}</span>
                    <span aria-hidden="true">·</span>
                    <span>المكان: {sess.location || 'مدرج الكيمياء'}</span>
                  </div>
                </div>

                {alreadyCheckedIn ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 text-xs font-medium">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>تم تسجيل حضورك مسبقاً ✅</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSessionId(sess.id);
                      setIsCheckInModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>تسجيل الحضور الآن</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0F1626] border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">نسبة الحضور التراكمية</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-teal-400">{attendanceRatio}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">محسوبة من إجمالي المحاضرات</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1626] border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">المحاضرات المحضورة</span>
          <p className="text-2xl font-bold font-mono tabular-nums text-white">{presentCount}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">جلسات تم اعتمادها بنجاح</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0F1626] border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">حالة القيد والتحقق</span>
          <p className="text-lg font-bold text-teal-300 mt-1">طالب مسجل ومنتظم</p>
          <span className="text-[11px] text-slate-500 mt-1 block">مدرج في كشف شعبة Special Chemistry</span>
        </div>
      </div>

      {/* Personal Attendance Record Table */}
      <div className="rounded-2xl bg-[#0F1626] border border-white/[0.08] p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">سجل المحاضرات والجلسات السابقة</h3>

        {records.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            لم تسجل حضوراً في أي محاضرة حتى الآن. انتظر فتح الجلسة من قبل عضو هيئة التدريس وسجل حضورك فوراً.
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r, i) => (
              <div
                key={r.attendanceId || i}
                className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.04] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-100 block">{r.courseId || 'Special Chemistry 203'}</span>
                  <div className="flex items-center gap-2 text-slate-500 mt-0.5 font-mono">
                    <span>{r.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>وقت التسجيل: {r.checkInTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-teal-400 font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>حاضر</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check In Modal */}
      <StudentCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSuccess={fetchStudentData}
        prefilledSessionId={selectedSessionId}
      />
    </div>
  );
};
