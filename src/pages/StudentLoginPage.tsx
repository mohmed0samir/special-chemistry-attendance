import React, { useState, useEffect } from 'react';
import { Users, Hash, User as UserIcon, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface StudentLoginPageProps {
  onNavigate: (path: string) => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({ onNavigate }) => {
  const { role, loginStudent } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'student') {
      onNavigate('/student/dashboard');
    }
  }, [role, onNavigate]);

  useEffect(() => {
    // Fetch all active groups from database
    const loadGroups = async () => {
      try {
        const data = await api.getAdminData();
        const grpSet = new Set<string>();
        data.groups.forEach((g) => grpSet.add((g.groupNumber || '').replace(/^مجموعة\s*/, '').trim()));
        data.students.forEach((s) => grpSet.add((s.groupNumber || '').replace(/^مجموعة\s*/, '').trim()));

        const sorted = Array.from(grpSet)
          .filter(Boolean)
          .sort((a, b) => {
            const na = parseInt(a, 10);
            const nb = parseInt(b, 10);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return a.localeCompare(b);
          });

        if (sorted.length > 0) {
          setAvailableGroups(sorted);
        } else {
          setAvailableGroups(['1', '2', '3', '4']);
        }
      } catch {
        setAvailableGroups(['1', '2', '3', '4']);
      }
    };

    loadGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim() || !groupNumber.trim()) {
      setError('يرجى إدخال اسم الطالب ورقم المجموعة.');
      return;
    }

    setLoading(true);
    const result = await loginStudent(studentName, groupNumber);
    setLoading(false);

    if (result.success) {
      onNavigate('/student/dashboard');
    } else {
      setError(result.error || 'بيانات الطالب غير موجودة في كشف الدفعة المعتمد.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl p-7 shadow-xl space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">تسجيل حضور الطالب</h2>
          <p className="text-xs text-slate-400">طلاب شعبة Special Chemistry - كلية العلوم</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              اسم الطالب الثلاثي / الرباعي
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="أدخل اسمك كما هو مسجل في الكشف"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رقم المجموعة (Group Number)
            </label>
            <div className="relative">
              <select
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="">اختر رقم مجموعتك...</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    مجموعة {g} (Group {g})
                  </option>
                ))}
              </select>
              <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              يتم التحقق مباشرة من كشف الشعبة المعتمد بدون الحاجة لكلمة مرور
            </p>
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
                <span>الدخول وتسجيل الحضور</span>
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
