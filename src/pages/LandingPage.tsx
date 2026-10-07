import React from 'react';
import {
  FlaskConical, GraduationCap, Shield, Users,
  QrCode, MapPin, FileSpreadsheet, ArrowLeft, Check, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { role } = useAuth();

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* Editorial Header / Hero */}
      <section className="border-b border-white/[0.08] pb-12 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-teal-400 mb-3 tracking-wide">
              <span>كلية العلوم</span>
              <span aria-hidden="true">·</span>
              <span>شعبة الكيمياء الخاصة</span>
              <span aria-hidden="true">·</span>
              <span>العام الأكاديمي 2026/2027</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              نظام إدارة الحضور والغياب الأكاديمي
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            منظومة رقمية مخصصة لشعبة Special Chemistry لضبط حضور المحاضرات والمعامل بتقنية التحقق الجغرافي المزدوج ورموز الاستجابة المتغيرة.
          </p>
        </div>

        {/* 3 Dedicated Access Gates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          {/* Gate 1: Student */}
          <div className="group rounded-2xl bg-[#0F1626] border border-white/[0.08] hover:border-teal-500/40 p-6 flex flex-col justify-between transition-all duration-200">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">بوابة الطلاب</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                تسجيل الحضور الفوري في المحاضرة النشطة باستخدام الاسم المسجل ورقم المجموعة، مع التحقق من التواجد الفعلي داخل القاعة.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/student/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-between transition-colors"
            >
              <span>تسجيل حضور محاضرة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Gate 2: Faculty / Doctor */}
          <div className="group rounded-2xl bg-[#0F1626] border border-white/[0.08] hover:border-teal-500/40 p-6 flex flex-col justify-between transition-all duration-200">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">هيئة التدريس والمحاضرين</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                بدء جلسة الحضور الذكية، عرض رمز QR الديناميكي على شاشة العرض بالمدرج، ومتابعة كشف الحاضرين لحظياً.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/doctor/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-between border border-white/[0.08] transition-colors"
            >
              <span>دخول المحاضر</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Gate 3: Admin */}
          <div className="group rounded-2xl bg-[#0F1626] border border-white/[0.08] hover:border-teal-500/40 p-6 flex flex-col justify-between transition-all duration-200">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">إدارة الشعبة والمشرف</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                إشراف المشرف الأكاديمي: إدارة كشوف الطلاب، استيراد ملفات Excel، اعتماد حسابات الدكاترة، وتصدير التقارير الرسمية.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/admin/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-between border border-white/[0.08] transition-colors"
            >
              <span>لوحة الإشراف الأكاديمي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Domain Mechanisms (Structured Grid, no pill sandwiches) */}
      <section className="space-y-6">
        <div>
          <span className="text-xs text-teal-400 font-medium">الآليات التقنية والأمان الأكاديمي</span>
          <h2 className="text-2xl font-bold text-white mt-1">معايير دقة وضبط الحضور</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0D1322] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">رمز QR مشفر وديناميكي</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              توليد رمز استجابة سريعة يتجدد تلقائياً كل 30 ثانية في جلسة المحاضرة النشطة، لمنع تداول الصور أو التسجيل بالنيابة عن الغائبين.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D1322] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">التحقق الجغرافي من القاعة</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              مطابقة إحداثيات GPS لجهاز الطالب بنطاق مدرج الكيمياء المحدد (نصف قطر 80 متراً) لضمان التواجد الفعلي قبل اعتماد الحضور.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0D1322] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-white text-sm">تكامل كامل مع Excel و CSV</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              استيراد قوائم الدفعة مباشرة من كشوف شؤون الطلاب، وتصدير تقارير ونسب الحضور التفصيلية بصيغة .xlsx المعتمدة بنقرة واحدة.
            </p>
          </div>
        </div>
      </section>

      {/* University Department Footer Note */}
      <footer className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span>Special Chemistry Attendance System · قسم الكيمياء الخاصة</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>المشرف المسؤول: محمد سمير عبدالعاطي</span>
          <span aria-hidden="true">·</span>
          <span>نسخة النظام 2.0 المستقرة</span>
        </div>
      </footer>
    </div>
  );
};
