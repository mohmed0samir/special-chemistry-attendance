import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Clock, RefreshCw, PowerOff, Check, MapPin, Download } from 'lucide-react';
import { AttendanceSession, AttendanceRecord } from '../types';
import { api } from '../lib/api';
import { exportToExcel, exportToCSV } from '../lib/excel-helpers';

interface QRModalProps {
  session: AttendanceSession;
  isOpen: boolean;
  onClose: () => void;
  onSessionClosed?: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ session, isOpen, onClose, onSessionClosed }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentToken, setCurrentToken] = useState<string>(session.randomToken);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [tokenCountdown, setTokenCountdown] = useState<number>(30);
  const [closing, setClosing] = useState<boolean>(false);

  // Rotate token and update QR
  useEffect(() => {
    if (!isOpen || session.status === 'CLOSED') return;

    const generateAndDrawQR = async () => {
      try {
        const payload = JSON.stringify({
          s: session.id,
          t: currentToken,
          g: session.groupNumber,
          c: session.courseCode || 'CHEM',
        });

        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#022c22',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateAndDrawQR();

    // Rotate token countdown ticker
    const countdownTimer = setInterval(() => {
      setTokenCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    // Rotate security token every 30 seconds
    const tokenInterval = setInterval(async () => {
      try {
        const res = await api.rotateSessionToken(session.id);
        setCurrentToken(res.token);
        setTokenCountdown(30);
      } catch (e) {
        // quiet catch
      }
    }, 30000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(countdownTimer);
    };
  }, [isOpen, session.id, currentToken, session.status]);

  // Overall session countdown
  useEffect(() => {
    if (!isOpen || session.status === 'CLOSED') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session.status]);

  // Live polling of student records
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecords = async () => {
      try {
        const res = await api.getSessionRecords(session.id);
        setRecords(res.records || []);
      } catch {}
    };

    fetchRecords();
    const pollInterval = setInterval(fetchRecords, 2000);
    return () => clearInterval(pollInterval);
  }, [isOpen, session.id]);

  // Close session action
  const handleCloseSession = async () => {
    setClosing(true);
    try {
      await api.closeDoctorSession(session.id);
      session.status = 'CLOSED';
      if (onSessionClosed) onSessionClosed();
    } catch (err) {
      console.error('Failed to close session:', err);
    } finally {
      setClosing(false);
    }
  };

  // Export report
  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportData = records.map((r, index) => ({
      'م': index + 1,
      'رقم الطالب': r.studentId,
      'اسم الطالب': r.studentName,
      'المجموعة': `مجموعة ${r.groupNumber}`,
      'المادة': session.courseName,
      'التاريخ': session.date,
      'وقت الحضور': r.checkInTime,
      'التحقق من الـ QR': r.qrVerified ? 'نعم' : 'لا',
      'التحقق من الموقع': r.locationVerified ? 'نعم (داخل القاعة)' : 'لا',
      'الحالة': r.status === 'PRESENT' ? 'حاضر' : r.status,
    }));

    const filename = `كشف_حضور_${session.courseCode || 'كيمياء'}_مجموعة_${session.groupNumber}_${session.date}`;
    if (format === 'xlsx') {
      exportToExcel(exportData, filename, 'الحضور');
    } else {
      exportToCSV(exportData, filename);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
              <h3 className="text-base font-bold text-white">
                شاشة عرض المحاضرة · {session.courseName} ({session.courseCode})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span>مجموعة: {session.groupNumber}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {session.location || 'مدرج الكيمياء الرئيسي'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{session.date}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into QR on Left and Live Attendees on Right */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* QR Side (6 cols) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#090D16] border border-white/[0.08] text-center">
            {session.status === 'CLOSED' ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <PowerOff className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">تم إغلاق جلسة الحضور</h4>
                <p className="text-xs text-slate-400">انتهت مدة تسجيل الحضور لهذه المحاضرة.</p>
              </div>
            ) : (
              <>
                {/* Timer & Token Status */}
                <div className="flex items-center justify-between w-full mb-4 px-1 text-xs">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-slate-400">الوقت المتبقي:</span>
                    <span className="font-bold tabular-nums text-teal-400">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <RefreshCw className="w-3 h-3 text-teal-400 animate-spin" />
                    <span>يتجدد خلال {tokenCountdown}ث</span>
                  </div>
                </div>

                {/* QR Display */}
                <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-teal-500/40">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Session QR Code" className="w-60 h-60 object-contain" />
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center text-slate-500 text-xs">
                      جاري توليد رمز الـ QR...
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs text-slate-300">
                    امسح الرمز بكاميرا الهاتف أو ادخل كود المحاضرة
                  </p>
                  <p className="text-[11px] font-mono text-teal-300 bg-slate-900 px-3 py-1 rounded-lg border border-white/[0.08] inline-block">
                    كود الجلسة: {session.id}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Attendees Side (6 cols) */}
          <div className="md:col-span-6 flex flex-col justify-between p-6 rounded-2xl bg-[#090D16] border border-white/[0.08]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">الطلاب الحاضرون الآن</h4>
                  <span className="font-mono tabular-nums text-xs font-bold text-teal-400">
                    ({records.length})
                  </span>
                </div>

                {records.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="px-2 py-1 rounded bg-teal-600/20 text-teal-300 hover:bg-teal-600/30 text-[11px] font-medium border border-teal-500/20"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px] font-medium border border-white/[0.08]"
                    >
                      CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Real-time attendee feed */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {records.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">
                    في انتظار تسجيل أول طالب... ستظهر الأسماء هنا لحظة المسح.
                  </p>
                ) : (
                  records.map((r, i) => (
                    <div
                      key={r.attendanceId || i}
                      className="p-2.5 rounded-lg bg-[#0F1626] border border-white/[0.04] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-500 w-4 text-[11px]">
                          {i + 1}.
                        </span>
                        <div>
                          <span className="font-medium text-slate-100 block">{r.studentName}</span>
                          <span className="text-[10px] font-mono text-slate-500">{r.studentId}</span>
                        </div>
                      </div>
                      <div className="text-left font-mono tabular-nums text-teal-400 text-[11px]">
                        {r.checkInTime}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                حالة الجلسة: {session.status === 'OPEN' ? 'مفتوحة 🟢' : 'مغلقة 🔒'}
              </span>

              {session.status === 'OPEN' && (
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors"
                >
                  {closing ? 'جاري الإغلاق...' : 'إنهاء الجلسة وإغلاق الباب'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
