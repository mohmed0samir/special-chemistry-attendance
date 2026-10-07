import React, { useState, useEffect } from 'react';
import { Users, Hash, User as UserIcon, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentLoginPageProps {
  onNavigate: (path: string) => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({ onNavigate }) => {
  const { role, loginStudent } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'student') {
      onNavigate('/student/dashboard');
    }
  }, [role, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim() || !groupNumber.trim()) {
      setError('يرجى إدخال الاسم ورقم المجموعة.');
      return;
    }

    setLoading(true);
    const result = await loginStudent(studentName, groupNumber);
    setLoading(false);

    if (result.success) {
      onNavigate('/student/dashboard');
    } else {
      setError(result.error || 'بيانات الطالب غير موجودة في قائمة الدفعة.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">تسجيل حضور الطالب</h2>
          <p className="text-xs text-slate-400">شعبة Special Chemistry</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              الاسم الرباعي المسجل
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="أدخل اسمك كما هو بكشف الكلية"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              رقم المجموعة / السكشن
            </label>
            <div className="relative">
              <input
                type="text"
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                placeholder="مثال: 1 أو 2 أو 3"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              إذا كانت مجموعتك "Group 3"، اكتب فقط: 3
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>دخول وتسجيل الحضور</span>
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
