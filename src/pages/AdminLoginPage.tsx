import React, { useState, useEffect } from 'react';
import {
  Shield, KeyRound, User as UserIcon, AlertTriangle, ArrowRight,
  CheckCircle2, Lock
} from 'lucide-react';
import { useAuth, ADMIN_INITIAL_NAME } from '../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { role, loginAdmin } = useAuth();
  const [username, setUsername] = useState(ADMIN_INITIAL_NAME);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      onNavigate('/admin/dashboard');
    }
  }, [role, onNavigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginAdmin(username, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('تم تسجيل الدخول بنجاح ✅');
      setTimeout(() => {
        onNavigate('/admin/dashboard');
      }, 700);
    } else {
      setError(res.error || 'اسم المشرف أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">تسجيل دخول المشرف الأكاديمي</h2>
          <p className="text-xs text-slate-400">إدارة شعبة Special Chemistry</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم المشرف المعتمد
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="محمد سمير عبدالعاطي"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
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
                placeholder="Chemist 2030"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              كلمة المرور الأولية المعتمدة: Chemist 2030
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول لوحة الإدارة</span>
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
