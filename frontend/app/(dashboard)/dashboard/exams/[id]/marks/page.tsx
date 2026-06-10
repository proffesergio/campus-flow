'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Exam {
  id: string; name: string; totalMarks: number; isPublished: boolean; term: string;
  subject: { name: string } | null;
  class: { name: string; section: string | null } | null;
}
interface GradeRow {
  studentId: string; firstName: string; lastName: string; rollNumber: string | null;
  marksObtained: number | null; isAbsent: boolean; grade: string | null; remarks: string;
}

const DEFAULT_THRESHOLDS = [
  { min: 90, label: 'A+' }, { min: 80, label: 'A' }, { min: 70, label: 'B+' },
  { min: 60, label: 'B' }, { min: 50, label: 'C' }, { min: 40, label: 'D' }, { min: 0, label: 'F' },
];

function computeGrade(marks: number, total: number): string {
  const pct = (marks / total) * 100;
  return DEFAULT_THRESHOLDS.find((t) => pct >= t.min)?.label ?? 'F';
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-400', A: 'text-green-400', 'B+': 'text-lime-400',
  B: 'text-yellow-400', C: 'text-orange-400', D: 'text-red-400', F: 'text-red-600',
};

export default function ExamMarksPage() {
  const t = useTranslations('exams');
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, gradesRes] = await Promise.all([
        api.get<{ success: boolean; data: Exam }>(`/exams/${id}`),
        api.get<{ success: boolean; data: GradeRow[] }>(`/grades?examId=${id}`),
      ]);
      setExam(examRes.data.data);
      setGrades(gradesRes.data.data);
    } catch { toast.error(t('failedLoad')); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateGrade(studentId: string, field: keyof GradeRow, value: unknown) {
    setGrades((prev) => prev.map((g) => g.studentId === studentId ? { ...g, [field]: value } : g));
  }

  async function saveGrades() {
    setSaving(true);
    try {
      await api.post('/grades/bulk', {
        examId: id,
        grades: grades.map((g) => ({
          studentId: g.studentId,
          marksObtained: g.isAbsent ? null : g.marksObtained,
          isAbsent: g.isAbsent,
          remarks: g.remarks,
        })),
      });
      toast.success(t('gradesSaved'));
      fetchData();
    } catch { toast.error(t('failedSaveGrades')); }
    finally { setSaving(false); }
  }

  async function togglePublish() {
    try {
      await api.post(`/exams/${id}/publish`);
      toast.success(exam?.isPublished ? t('unpublishSuccess') : t('publishSuccess'));
      fetchData();
    } catch { toast.error(t('failedPublish')); }
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48 bg-zinc-800" />
      <Skeleton className="h-64 bg-zinc-800 rounded-xl" />
    </div>
  );

  if (!exam) return (
    <div className="p-6 text-center text-zinc-400">{t('examNotFound')}</div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/exams"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{exam.name}</h1>
          <p className="text-sm text-zinc-500">
            {exam.subject?.name ?? '—'} · {exam.class ? `${exam.class.name}${exam.class.section ? ` – ${exam.class.section}` : ''}` : '—'} · {exam.term}
          </p>
        </div>
        <Button onClick={togglePublish} variant="outline"
          className={`border gap-2 ${exam.isPublished ? 'border-amber-500/40 text-amber-400' : 'border-zinc-700 text-zinc-400'}`}>
          <Eye className="w-4 h-4" />
          {exam.isPublished ? t('btnUnpublish') : t('btnPublish')}
        </Button>
        <Button onClick={saveGrades} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Save className="w-4 h-4" />
          {saving ? t('btnSaving') : t('btnSaveGrades')}
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {[
                t('marksColStudent'),
                t('marksColRoll'),
                t('marksColAbsent'),
                t('marksColMarks', { total: exam.totalMarks }),
                t('marksColGrade'),
                t('marksColRemarks'),
              ].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  {t('marksNoStudents')}
                </td>
              </tr>
            ) : grades.map((g) => {
              const gradeLabel = !g.isAbsent && g.marksObtained !== null
                ? computeGrade(g.marksObtained, exam.totalMarks)
                : g.isAbsent ? 'ABS' : '—';
              return (
                <tr key={g.studentId} className="border-b border-zinc-800/50">
                  <td className="px-4 py-2 text-sm font-medium text-zinc-200">
                    {g.firstName} {g.lastName}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-500">{g.rollNumber ?? '—'}</td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={g.isAbsent}
                      onChange={(e) => updateGrade(g.studentId, 'isAbsent', e.target.checked)}
                      className="w-4 h-4 accent-red-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      max={exam.totalMarks}
                      disabled={g.isAbsent}
                      value={g.marksObtained ?? ''}
                      onChange={(e) => updateGrade(g.studentId, 'marksObtained', e.target.value === '' ? null : parseFloat(e.target.value))}
                      className="w-24 h-8 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm text-white disabled:opacity-40 focus:outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className={`px-4 py-2 text-sm font-bold ${GRADE_COLOR[gradeLabel] ?? 'text-zinc-500'}`}>
                    {gradeLabel}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={g.remarks}
                      onChange={(e) => updateGrade(g.studentId, 'remarks', e.target.value)}
                      placeholder={t('remarksPlaceholder')}
                      className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded px-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
