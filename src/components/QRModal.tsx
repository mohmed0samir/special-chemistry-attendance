import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Clock, Users, RefreshCw, PowerOff, CheckCircle2, MapPin, Download } from 'lucide-react';
import { AttendanceSession, AttendanceRecord } from '../types';
import { api } from '../lib/api';
import { exportToExcel, exportToCSV } from '../lib/excel-helpers';
import { generateRandomPart } from '../lib/auth-helpers';

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
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 mins
  const [closing, setClosing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
            dark: '#022c22', // deep emerald
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

    // Rotate security token every 25 seconds for dynamic anti-screenshot protection
    const tokenInterval = setInterval(async () => {
      try {
        const res = await api.rotateSessionToken(session.id);
        setCurrentToken(res.token);
      } catch (e) {
        // quiet catch
      }
    }, 25000);

    return () => clearInterval(tokenInterval);
  }, [isOpen, session.id, currentToken, session.status, session.groupNumber, session.courseCode]);

  // Polling for live attendees of this session
  useEffect(() => {
    if (!isOpen) return;

    const fetchLiveRecords = async () => {
      try {
        const res = await api.getSessionRecords(session.id);
        setRecords(res.records);
      } catch (e) {}
    };

    fetchLiveRecords();
    const pollInterval = setInterval(fetchLiveRecords, 2000);
    return () => clearInterval(pollInterval);
  }, [isOpen, session.id]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || session.status === 'CLOSED') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCloseSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, session.status]);

  const handleCloseSession = async () => {
    setClosing(true);
    try {
      await api.closeDoctorSession(session.id);
      if (onSessionClosed) onSessionClosed();
    } catch (err) {
      console.error('Error closing session:', err);
    } finally {
      setClosing(false);
    }
  };

  const handleExportAttendees = (format: 'xlsx' | 'csv') => {
    const exportData = records.map((r, i) => ({
      'م': i + 1,
      'اسم الطالب': r.studentName,
      'رقم الطالب': r.studentId,
      'المجموعة': `مجموعة ${r.groupNumber}`,
      'المادة': session.courseName || session.courseCode || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-white">
                جلسة تسجيل الحضور المباشرة | {session.courseName} ({session.courseCode})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>مجموعة: {session.groupNumber}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {session.location || 'القاعة الرئيسية'}
              </span>
              <span>•</span>
              <span>التاريخ: {session.date}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split into QR Code on Right and Live Attendees on Left */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* QR Side (7 cols) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center">
            {session.status === 'CLOSED' ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <PowerOff className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">تم إغلاق جلسة الحضور 🔒</h4>
                <p className="text-xs text-slate-400">لا يمكن للطلاب تسجيل الحضور الآن لهذه الجلسة.</p>
              </div>
            ) : (
              <>
                {/* Timer & Token Status */}
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 font-medium">الوقت المتبقي:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-400 px-2.5 py-1 rounded-lg bg-teal-950/40 border border-teal-500/20">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>رمز أمان ديناميكي</span>
                  </div>
                </div>

                {/* QR Display */}
                <div className="p-4 bg-white rounded-2xl shadow-xl shadow-emerald-950/30 border-4 border-emerald-500/30">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Session QR Code" className="w-64 h-64 object-contain" />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs">
                      جاري توليد رمز الـ QR...
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-semibold text-slate-200">
                    امسح الكود عبر شاشة الهاتف أو ادخل الرمز السريع
                  </p>
                  <p className="text-[11px] font-mono text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 inline-block">
                    رمز الجلسة: {session.id.slice(0, 8).toUpperCase()} | {currentToken}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Live Attendance List Side (6 cols) */}
          <div className="md:col-span-6 flex flex-col rounded-2xl bg-slate-950/40 border border-slate-800 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">الطلاب الحاضرين حالياً</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold">
                  {records.length}
                </span>
              </div>
              {records.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExportAttendees('xlsx')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    title="تصدير كشف Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleExportAttendees('csv')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    title="تصدير كشف CSV"
                  >
                    <span>CSV</span>
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-80 space-y-2 pr-1">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  في انتظار مسح الطلاب للرمز وتسجيل الحضور...
                </div>
              ) : (
                records.map((rec) => (
                  <div
                    key={rec.attendanceId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{rec.studentName}</p>
                        <p className="text-[10px] text-slate-400">مجموعة {rec.groupNumber}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-mono text-slate-400 block">{rec.checkInTime}</span>
                      {rec.locationVerified && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/10 text-teal-400 rounded">
                          موقع معتمد
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            جلسة: {session.courseName} - شعبة Special Chemistry
          </span>
          {session.status !== 'CLOSED' && (
            <button
              onClick={handleCloseSession}
              disabled={closing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
            >
              <PowerOff className="w-4 h-4" />
              <span>{closing ? 'جاري الإغلاق...' : 'إنهاء تسجيل الحضور الآن 🔒'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
