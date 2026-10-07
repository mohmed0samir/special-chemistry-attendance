import React, { useState } from 'react';
import { X, QrCode, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

      // 2. Submit check-in directly without GPS location hurdles
      const res = await api.studentCheckIn({
        sessionId: targetSessionId,
        studentId: studentProfile.id,
        studentName: studentProfile.name,
        groupNumber: studentProfile.groupNumber,
      });

      setIsSuccess(true);
      setStatusMessage(res.message || 'تم تسجيل الحضور بنجاح ✅');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
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
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
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
          <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">الطالب:</span>
              <span className="text-sm font-semibold text-white">{studentProfile?.name}</span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 block">المجموعة:</span>
              <span className="text-xs font-mono text-teal-300">
                مجموعة {studentProfile?.groupNumber}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                isSuccess
                  ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium'
              }`}
            >
              {isSuccess ? (
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Session Code or QR Payload Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              كود جلسة المحاضرة أو رمز الـ QR
            </label>
            <div className="relative">
              <input
                type="text"
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="ألصق كود الجلسة أو امسح كود الـ QR من شاشة الدكتور"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors font-mono"
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              يتم تسجيل الحضور مباشرة وبشكل فوري بمجرد إدخال الكود
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || isSuccess}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الحضور...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
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
