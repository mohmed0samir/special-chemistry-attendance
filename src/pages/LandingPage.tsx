import React from 'react';
import { FlaskConical, GraduationCap, Shield, Users, CheckCircle, QrCode, MapPin, Database, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { role } = useAuth();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800/80 via-slate-900/60 to-slate-950 p-8 sm:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <FlaskConical className="w-4 h-4" />
            <span>نظام الحضور والغياب لشعبة Special Chemistry</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            نظام الحضور والغياب الجامعي <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              شعبة الكيمياء الخاصة
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
            نظام متكامل لإدارة حضور وغياب المحاضرات والمعامل بتقنية رمز الاستجابة السريع (QR Code) مع التحقق من الموقع الجغرافي داخل القاعة، مبني بالكامل على معايير الإنتاج وخطة Firebase Spark المجانية بدون أي تكاليف أو خدمات مدفوعة.
          </p>

          {/* Role Access Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/student/login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/20 hover:scale-102 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>دخول الطالب (بالاسم والمجموعة)</span>
            </button>

            <button
              onClick={() => onNavigate('/doctor/login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-xl shadow-teal-600/20 hover:scale-102 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>بوابة الدكاترة والمحاضرين</span>
            </button>

            <button
              onClick={() => onNavigate('/admin/login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 hover:scale-102 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>لوحة الإدارة الأكاديمية</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">QR ديناميكي لمنع التحايل</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            يتم تحديث رمز الحضور المشفر دورياً كل 25 ثانية على شاشة الدكتور لمنع تصوير الشاشة وإرسالها للزملاء خارج القاعة.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">التحقق الجغرافي GPS</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            حساب المسافة بين إحداثيات الطالب وموقع قاعة المحاضرة أو المعمل بدقة؛ لا يتم تسجيل الحضور إلا داخل النطاق المسموح.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Spark Plan متوافق 100%</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            مبني للعمل على باقة Firebase Spark المجانية بدون أي خوادم مدفوعة أو Cloud Run، مع حفظ حقيقي في Cloud Firestore.
          </p>
        </div>
      </section>

      {/* Guidelines and Details */}
      <section className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>إرشادات حضور شعبة Special Chemistry</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>الطالب لا يحتاج لإنشاء حساب؛ تسجيل الدخول يتم بالاسم الرباعي ورقم المجموعة المعتمدين.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>جلسات الحضور تفتح لمدة محددة من بداية المحاضرة، ويتم غلقها تلقائياً.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>يمنع منعاً باتاً تكرار تسجيل الحضور لنفس الطالب في الجلسة الواحدة بواسطة القفل الذري.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>تقارير الحضور والغياب وكشوفات الإكسيل تصدر مباشرة من لوحة التحكم بضغطة زر.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
