import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, User as UserIcon, AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { useAuth, ADMIN_INITIAL_NAME } from '../context/AuthContext';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { role, loginAdmin } = useAuth();
  const [username, setUsername] = useState(ADMIN_INITIAL_NAME);
  const [password, setPassword] = useState('Chemist 2030');
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
      setSuccessMsg('تم التحقق بنجاح. جاري الدخول للوحة الإدارة...');
      setTimeout(() => {
        onNavigate('/admin/dashboard');
      }, 500);
    } else {
      setError(res.error || 'اسم المشرف أو كلمة المرور غير صحيحة.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">تسجيل دخول المشرف الأكاديمي</h2>
          <p className="text-xs text-slate-400">إدارة شعبة Special Chemistry</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-teal-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم المشرف المعتمد
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="محمد سمير عبدالعاطي"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                كلمة المرور
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                الافتراضية: Chemist 2030
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Chemist 2030"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors font-mono"
                required
              />
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول لوحة التحكم الأكاديمية</span>
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
