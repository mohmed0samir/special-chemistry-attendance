import React, { useState, useEffect } from 'react';
import { GraduationCap, KeyRound, User as UserIcon, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DoctorLoginPageProps {
  onNavigate: (path: string) => void;
}

export const DoctorLoginPage: React.FC<DoctorLoginPageProps> = ({ onNavigate }) => {
  const { role, loginDoctor } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'doctor') {
      onNavigate('/doctor/dashboard');
    }
  }, [role, onNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginDoctor(identifier, password);
    setLoading(false);

    if (res.success) {
      onNavigate('/doctor/dashboard');
    } else {
      setError(res.error || 'اسم الدكتور أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">بوابة أعضاء هيئة التدريس</h2>
          <p className="text-xs text-slate-400">إدارة جلسات الحضور وقاعات المحاضرات</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم الدكتور أو البريد الأكاديمي
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="أدخل اسمك المسجل أو كود المقرر"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                required
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CHEM203-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition-colors font-mono"
                required
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              يتم استلام كلمة المرور مباشرة من المشرف الأكاديمي للشعبة
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول منصة المحاضر</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
