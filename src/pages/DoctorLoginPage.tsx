import React, { useState, useEffect } from 'react';
import { GraduationCap, KeyRound, User as UserIcon, AlertTriangle, ArrowRight } from 'lucide-react';
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">بوابة أعضاء هيئة التدريس</h2>
          <p className="text-xs text-slate-400">شعبة Special Chemistry</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم الدكتور
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="مثال: د. أحمد كمال"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                required
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CHEM203-XXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-teal-500 font-mono"
                required
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول لوحة المحاضر</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
