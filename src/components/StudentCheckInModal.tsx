import React, { useState } from 'react';
import { X, QrCode, MapPin, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation } from '../lib/geo';
import { api } from '../lib/api';

interface StudentCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledSessionId?: string;
}

export const StudentCheckInModal: React.FC<StudentCheckInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledSessionId = '',
}) => {
  const { studentProfile } = useAuth();
  const [sessionInput, setSessionInput] = useState<string>(prefilledSessionId);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;

    setStatusMessage('');
    setIsSuccess(false);
    setLoading(true);

    try {
      // 1. Parse session ID from either raw text or QR JSON payload
      let targetSessionId = sessionInput.trim();

      if (targetSessionId.startsWith('{')) {
        try {
          const parsed = JSON.parse(targetSessionId);
          targetSessionId = parsed.s || targetSessionId;
        } catch {}
      }

      if (!targetSessionId) {
        setStatusMessage('يرجى إدخال كود الجلسة أو مسح رمز الـ QR.');
        setLoading(false);
        return;
      }

      // 2. Fetch Geolocation coordinates if available
      let userLat: number | undefined;
      let userLng: number | undefined;
      try {
        const coords = await getCurrentLocation();
        userLat = coords.latitude;
        userLng = coords.longitude;
      } catch (geoErr: any) {
        // Location optional or warning
        console.warn('Geolocation probe:', geoErr.message);
      }

      // 3. Submit check-in to server API
      const res = await api.studentCheckIn({
        sessionId: targetSessionId,
        studentId: studentProfile.id,
        studentName: studentProfile.name,
        groupNumber: studentProfile.groupNumber,
        latitude: userLat,
        longitude: userLng,
      });

      setIsSuccess(true);
      setStatusMessage(res.message || 'تم تسجيل الحضور بنجاح ✅');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setIsSuccess(false);
      setStatusMessage(err.message || 'حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">تسجيل الحضور في المحاضرة</h3>
              <p className="text-xs text-slate-400">خاص بطلاب شعبة Special Chemistry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckIn} className="p-6 space-y-4">
          {/* Student Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">الطالب:</span>
              <span className="text-sm font-bold text-white">{studentProfile?.name}</span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 block">المجموعة:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                مجموعة {studentProfile?.groupNumber}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Session Code or QR Payload Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كود جلسة المحاضرة أو رمز الـ QR
            </label>
            <div className="relative">
              <input
                type="text"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="ألصق كود الجلسة أو بيانات الـ QR من شاشة الدكتور"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>يتم فحص الموقع الجغرافي للتأكد من تواجدك بالقاعة</span>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || isSuccess}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق والمطابقة...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد تسجيل الحضور</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
