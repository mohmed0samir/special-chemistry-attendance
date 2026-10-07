import React, { useState } from 'react';
import { Upload, X, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { parseStudentsExcel, ExcelImportSummary } from '../lib/excel-helpers';
import { api } from '../lib/api';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ExcelImportSummary | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMessage('');
    setSuccessMessage('');
    setParsing(true);

    try {
      const res = await parseStudentsExcel(selectedFile);
      setSummary(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في قراءة ملف الإكسيل.');
      setSummary(null);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!summary || summary.validStudents.length === 0) return;

    setImporting(true);
    setErrorMessage('');

    try {
      const validList = summary.validStudents;
      await api.importStudents(validList.map(st => ({
        studentId: st.studentId,
        name: st.name,
        groupNumber: st.groupNumber,
      })));

      setSuccessMessage(`تم استيراد ${summary.validStudents.length} طالب بنجاح وإضافتهم لقاعدة البيانات ✅`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء استيراد بيانات الطلاب.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0F1626] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">استيراد كشف الطلاب من ملف Excel</h3>
              <p className="text-xs text-slate-400">يدعم صيغ .xlsx و .xls (الاسم والمجموعة)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Picker */}
          {!summary && (
            <label className="border-2 border-dashed border-white/[0.12] hover:border-teal-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#090D16] text-center">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <span className="text-sm font-semibold text-slate-200 mb-1">
                اضغط لاختيار ملف Excel (.xlsx) أو اسحبه إلى هنا
              </span>
              <span className="text-xs text-slate-500">
                يجب أن يحتوي الملف على عمود "الاسم" وعمود "المجموعة"
              </span>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
                disabled={parsing}
              />
            </label>
          )}

          {parsing && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-slate-300 font-medium">جاري فحص وقراءة ملف الإكسيل...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {summary && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-center">
                  <span className="text-xs text-slate-400 block mb-1">إجمالي الطلاب</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-white">{summary.totalRows}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-center">
                  <span className="text-xs text-teal-300 block mb-1">الطلاب الصحيحين</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-teal-400">{summary.validStudents.length}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-center">
                  <span className="text-xs text-amber-300 block mb-1">التكرارات</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-amber-400">{summary.duplicateCount}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] text-center">
                  <span className="text-xs text-rose-300 block mb-1">الأخطاء</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-rose-400">{summary.errorCount}</span>
                </div>
              </div>

              {/* Groups Distribution */}
              <div>
                <h4 className="text-xs font-medium text-slate-300 mb-2">توزيع الطلاب حسب المجموعات:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(summary.groupsCount).map(([group, count]) => (
                    <span
                      key={group}
                      className="px-3 py-1 rounded-lg bg-[#090D16] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5 font-mono"
                    >
                      <span className="text-teal-400 font-semibold">مجموعة {group}:</span>
                      <span>{count} طالب</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-slate-300">معاينة أولية (Sample Preview):</h4>
                  <button
                    onClick={() => {
                      setSummary(null);
                      setFile(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    تغيير الملف
                  </button>
                </div>
                <div className="border border-white/[0.08] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#090D16] text-slate-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">اسم الطالب</th>
                        <th className="p-2.5">المجموعة</th>
                        <th className="p-2.5">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {summary.validStudents.slice(0, 10).map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="p-2.5 text-slate-500 font-mono tabular-nums">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-200">{st.name}</td>
                          <td className="p-2.5 text-slate-300 font-mono">مجموعة {st.groupNumber}</td>
                          <td className="p-2.5">
                            <span className="text-teal-400 text-xs font-mono">صحيح ✓</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between bg-[#0A0E17]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            إلغاء
          </button>
          {summary && (
            <button
              onClick={handleConfirmImport}
              disabled={importing || summary.validStudents.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {importing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الاستيراد والحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد استيراد {summary.validStudents.length} طالب</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
