import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FlaskConical, LogOut, User as UserIcon, Shield, GraduationCap, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { role, adminProfile, doctorProfile, studentProfile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Department */}
          <div
            className="flex items-center space-x-3 space-x-reverse cursor-pointer group"
            onClick={() => onNavigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-wide text-white">
                  Special Chemistry
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium hidden sm:inline-block">
                  Spark Plan
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">نظام الحضور والغياب الأكاديمي</p>
            </div>
          </div>

          {/* User state and actions */}
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{adminProfile?.name || 'مدير النظام'}</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 rounded text-[10px] text-emerald-300 font-bold">ADMIN</span>
                </div>
                <button
                  onClick={() => onNavigate('/admin/dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentPath.startsWith('/admin')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  لوحة الإدارة
                </button>
              </div>
            )}

            {role === 'doctor' && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 text-xs">
                  <GraduationCap className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold">{doctorProfile?.name || 'عضو هيئة التدريس'}</span>
                  <span className="px-1.5 py-0.2 bg-teal-500/20 rounded text-[10px] text-teal-300 font-bold">DOCTOR</span>
                </div>
                <button
                  onClick={() => onNavigate('/doctor/dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentPath.startsWith('/doctor')
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  لوحة المحاضر
                </button>
              </div>
            )}

            {role === 'student' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">{studentProfile?.name}</span>
                  <span className="px-1.5 py-0.2 bg-blue-500/20 rounded text-[10px] text-blue-300 font-bold">
                    مجموعة {studentProfile?.groupNumber}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('/student/dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentPath.startsWith('/student')
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  لوحة الطالب
                </button>
              </div>
            )}

            {role ? (
              <button
                onClick={async () => {
                  await logout();
                  onNavigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/student/login')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-colors"
                >
                  دخول الطالب
                </button>
                <button
                  onClick={() => onNavigate('/doctor/login')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 text-xs font-semibold transition-colors"
                >
                  دخول الدكتور
                </button>
                <button
                  onClick={() => onNavigate('/admin/login')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-colors"
                >
                  دخول المشرف
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
