import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DoctorLoginPage } from './pages/DoctorLoginPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

function AppContent() {
  const { role, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection
  useEffect(() => {
    if (loading) return;

    if (currentPath.startsWith('/admin') && currentPath !== '/admin/login' && role !== 'admin') {
      navigate('/admin/login');
    } else if (currentPath.startsWith('/doctor') && currentPath !== '/doctor/login' && role !== 'doctor') {
      navigate('/doctor/login');
    } else if (currentPath.startsWith('/student') && currentPath !== '/student/login' && role !== 'student') {
      navigate('/student/login');
    }
  }, [currentPath, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">جاري تحميل نظام Special Chemistry...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    if (currentPath === '/admin/login') {
      return <AdminLoginPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/admin')) {
      return <AdminDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/doctor/login') {
      return <DoctorLoginPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/doctor')) {
      return <DoctorDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/student/login') {
      return <StudentLoginPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/student')) {
      return <StudentDashboard onNavigate={navigate} />;
    }
    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/70 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-300">
            شعبة Special Chemistry • نظام الحضور والغياب الأكاديمي
          </p>
          <p className="text-[11px] text-slate-400">
            يعمل بالكامل وفق خطة Firebase Spark المجانية (Cloud Firestore & Firebase Auth) بدون خوادم مدفوعة
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
