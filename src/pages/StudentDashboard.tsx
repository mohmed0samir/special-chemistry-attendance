import React, { useState, useEffect } from 'react';
import {
  User, CheckCircle2, Clock, QrCode, MapPin, ShieldCheck
} from 'lucide-react';
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
    <div className="space-y-6 pb-16">
      {/* Student Welcome Header */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs font-bold text-blue-400 tracking-wider">
                شعبة Special Chemistry • مجموعة {studentProfile?.groupNumber}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{studentProfile?.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              رقم الطالب: {studentProfile?.studentId} • حالة القيد: طالب نشط
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedSessionId(openSessions[0]?.id || '');
            setIsCheckInModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/20 transition-all hover:scale-102"
        >
          <QrCode className="w-4 h-4" />
          <span>تسجيل الحضور في المحاضرة</span>
        </button>
      </div>

      {/* Active Live Sessions Banner */}
      {openSessions.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-bold text-sm">هناك جلسة حضور نشطة الآن لمجموعتك!</h3>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              مفتوحة حالياً
            </span>
          </div>

          {openSessions.map((sess) => {
            const alreadyCheckedIn = records.some((r) => r.sessionId === sess.id);
            return (
              <div
                key={sess.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{sess.courseName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>الدكتور: {sess.doctorName || 'هيئة التدريس'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {sess.location || 'القاعة الرئيسية'}
                    </span>
                  </div>
                </div>

                {alreadyCheckedIn ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم تسجيل حضورك بالفعل ✅</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSessionId(sess.id);
                      setIsCheckInModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>سجّل حضورك الآن</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">المحاضرات المسجلة</span>
          <p className="text-2xl font-black text-white">{records.length}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <span className="text-xs text-emerald-300 block mb-1">مرات الحضور</span>
          <p className="text-2xl font-black text-emerald-400">{presentCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">مرات الغياب</span>
          <p className="text-2xl font-black text-slate-400">
            {records.filter((r) => r.status === 'ABSENT').length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
          <span className="text-xs text-blue-300 block mb-1">نسبة الحضور</span>
          <p className="text-2xl font-black text-blue-400">
            {records.length > 0 ? `${attendanceRatio}%` : '—'}
          </p>
        </div>
      </div>

      {/* Student Attendance Logs */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>سجل الحضور الأكاديمي الخاص بي</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {records.length} جلسة
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">المادة</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">وقت التسجيل</th>
                <th className="p-3.5">التحقق الجغرافي</th>
                <th className="p-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    لم تسجل حضوراً في أي محاضرة حتى الآن. استخدم زر "تسجيل الحضور" عند بدء المحاضرة.
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.attendanceId} className="hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-500 font-mono">{i + 1}</td>
                    <td className="p-3.5 font-bold text-slate-200">{r.courseId}</td>
                    <td className="p-3.5 text-slate-300">{r.date}</td>
                    <td className="p-3.5 font-mono text-slate-400">{r.checkInTime}</td>
                    <td className="p-3.5">
                      {r.locationVerified ? (
                        <span className="flex items-center gap-1 text-[11px] text-teal-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>معتمد بالقاعة</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">رمز فقط</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {r.status === 'PRESENT' ? 'حاضر ✅' : r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-In Modal */}
      <StudentCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        prefilledSessionId={selectedSessionId}
        onSuccess={() => {
          fetchStudentData();
        }}
      />
    </div>
  );
};
