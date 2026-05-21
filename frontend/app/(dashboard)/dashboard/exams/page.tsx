'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Pencil, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Exam {
  id: string; name: string; examType: string; examDate: string;
  totalMarks: number; passingMarks: number | null; isPublished: boolean; term: string;
  subject: { name: string } | null;
  class: { name: string; section: string | null } | null;
  _count: { grades: number };
}
interface Class { id: string; name: string; section: string | null }

const TYPE_LABEL: Record<string, string> = {
  midterm: 'Midterm', final: 'Final', quiz: 'Quiz',
  assignment: 'Assignment', class_test: 'Class Test',
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set('classId', classFilter);
      const res = await api.get<{ success: boolean; data: Exam[] }>(`/exams?${params}`);
      setExams(res.data.data ?? []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  }, [classFilter]);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      fetchExams();
    } catch { toast.error('Failed to delete'); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exams & Grades</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage exams and enter grades</p>
        </div>
        <Link href="/dashboard/exams/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> New Exam
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
          ))}
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Exam', 'Subject', 'Class', 'Type', 'Date', 'Marks', 'Graded', 'Status', ''].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16 bg-zinc-800" /></td>
                  ))}
                </tr>
              ))
            ) : exams.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No exams yet</p>
                  <Link href="/dashboard/exams/new" className="text-blue-400 text-sm hover:underline mt-1 block">
                    Create your first exam
                  </Link>
                </td>
              </tr>
            ) : (
              exams.map((exam) => (
                <tr key={exam.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-sm font-medium text-white">{exam.name}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{exam.subject?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {exam.class ? `${exam.class.name}${exam.class.section ? ` – ${exam.class.section}` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{TYPE_LABEL[exam.examType] ?? exam.examType}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{new Date(exam.examDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{exam.totalMarks}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{exam._count.grades}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      exam.isPublished
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
                    }`}>
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/exams/${exam.id}/marks`}
                        className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                        title="Enter marks">
                        <ClipboardList className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(exam.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
