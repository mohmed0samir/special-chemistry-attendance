import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, LogOut, Shield, GraduationCap, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { role, adminProfile, doctorProfile, studentProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0A0E17]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element brand wordmark */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('/')}
          >
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 transition-colors">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-teal-300 transition-colors">
                Special Chemistry
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                قسم الكيمياء الخاصة · نظام الحضور الأكاديمي
              </span>
            </div>
          </div>

          {/* Zone 2: Clean 3-4 text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <button
              onClick={() => onNavigate('/')}
              className={`hover:text-white transition-colors relative py-1 ${
                currentPath === '/' ? 'text-teal-400 font-semibold' : ''
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => onNavigate('/student/login')}
              className={`hover:text-white transition-colors relative py-1 ${
                currentPath.startsWith('/student') ? 'text-teal-400 font-semibold' : ''
              }`}
            >
              بوابة الطالب
            </button>
            <button
              onClick={() => onNavigate('/doctor/login')}
              className={`hover:text-white transition-colors relative py-1 ${
                currentPath.startsWith('/doctor') ? 'text-teal-400 font-semibold' : ''
              }`}
            >
              أعضاء هيئة التدريس
            </button>
            <button
              onClick={() => onNavigate('/admin/login')}
              className={`hover:text-white transition-colors relative py-1 ${
                currentPath.startsWith('/admin') ? 'text-teal-400 font-semibold' : ''
              }`}
            >
              إدارة الشعبة
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions / user session */}
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  المشرف: <strong className="text-white font-semibold">{adminProfile?.name || 'محمد سمير عبدالعاطي'}</strong>
                </span>
                <button
                  onClick={() => onNavigate('/admin/dashboard')}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                >
                  لوحة التحكم
                </button>
              </div>
            )}

            {role === 'doctor' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  د. <strong className="text-white font-semibold">{doctorProfile?.name}</strong>
                </span>
                <button
                  onClick={() => onNavigate('/doctor/dashboard')}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                >
                  إدارة المحاضرة
                </button>
              </div>
            )}

            {role === 'student' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  الطالب: <strong className="text-white font-semibold">{studentProfile?.name}</strong> (مجموعة {studentProfile?.groupNumber})
                </span>
                <button
                  onClick={() => onNavigate('/student/dashboard')}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors"
                >
                  سجل حضوري
                </button>
              </div>
            )}

            {role ? (
              <button
                onClick={() => {
                  logout();
                  onNavigate('/');
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/student/login')}
                className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors whitespace-nowrap"
              >
                تسجيل الحضور
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
