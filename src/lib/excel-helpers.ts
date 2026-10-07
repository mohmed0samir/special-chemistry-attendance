import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  studentId: string;
  name: string;
  groupNumber: string;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

export interface ExcelImportSummary {
  totalRows: number;
  validStudents: ParsedStudentRow[];
  duplicateCount: number;
  errorCount: number;
  groupsCount: Record<string, number>;
}

/**
 * Parse and validate an uploaded Excel file (.xlsx or .xls)
 */
export async function parseStudentsExcel(file: File): Promise<ExcelImportSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('الملف فارغ أو لا يحتوي على بيانات.');
        }

        // Find header row or default to row 0
        let headerRowIndex = 0;
        let nameCol = -1;
        let groupCol = -1;
        let idCol = -1;

        for (let r = 0; r < Math.min(5, jsonRows.length); r++) {
          const row = jsonRows[r];
          if (Array.isArray(row)) {
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (val.includes('الاسم') || val.toLowerCase().includes('name')) {
                nameCol = c;
                headerRowIndex = r;
              } else if (val.includes('المجموعة') || val.toLowerCase().includes('group') || val.includes('سكشن') || val.includes('section')) {
                groupCol = c;
              } else if (val.includes('رقم') || val.includes('كود') || val.toLowerCase().includes('id')) {
                idCol = c;
              }
            }
            if (nameCol !== -1 && groupCol !== -1) {
              break;
            }
          }
        }

        // Fallback default columns if header not clearly named: Col 0 = Name, Col 1 = Group
        if (nameCol === -1) nameCol = 0;
        if (groupCol === -1) groupCol = 1;

        const seenNames = new Set<string>();
        const parsedRows: ParsedStudentRow[] = [];
        const groupsCount: Record<string, number> = {};
        let duplicateCount = 0;
        let errorCount = 0;

        for (let i = headerRowIndex + 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          const rawName = String(row[nameCol] || '').trim();
          const rawGroup = String(row[groupCol] || '').trim().replace(/^مجموعة\s*/, '').replace(/^Group\s*/i, '');
          const rawId = idCol !== -1 && row[idCol] ? String(row[idCol]).trim() : '';

          if (!rawName) continue; // skip totally empty trailing rows

          const uniqueKey = `${rawName}_${rawGroup}`.toLowerCase();
          const isDuplicate = seenNames.has(uniqueKey);

          let error = '';
          let isValid = true;

          if (rawName.length < 3) {
            isValid = false;
            error = 'الاسم قصير جدًا';
            errorCount++;
          } else if (!rawGroup) {
            isValid = false;
            error = 'رقم المجموعة مفقود';
            errorCount++;
          } else if (isDuplicate) {
            isValid = false;
            error = 'اسم الطالب مكرر في نفس المجموعة';
            duplicateCount++;
          } else {
            seenNames.add(uniqueKey);
            groupsCount[rawGroup] = (groupsCount[rawGroup] || 0) + 1;
          }

          // Generate a consistent student ID if not in sheet
          const studentId = rawId || `STU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

          parsedRows.push({
            studentId,
            name: rawName,
            groupNumber: rawGroup,
            isValid,
            error,
            isDuplicate,
          });
        }

        resolve({
          totalRows: parsedRows.length,
          validStudents: parsedRows.filter(p => p.isValid),
          duplicateCount,
          errorCount,
          groupsCount,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'فشل في قراءة ملف الإكسيل.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('حدث خطأ أثناء تحميل الملف.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export data rows to an Excel (.xlsx) file and trigger download
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Export data rows to a CSV file and trigger download
 */
export function exportToCSV(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
