'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

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

function classLabel(c: { name: string; section: string | null } | null) {
  return c ? `${c.name}${c.section ? ` – ${c.section}` : ''}` : '—';
}

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
      const res = await api.get<{ success: boolean; items?: Exam[]; data?: Exam[] }>(`/exams?${params}`);
      setExams(res.data.items ?? res.data.data ?? []);
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

  const columns: Column<Exam>[] = [
    { key: 'name', header: 'Exam', render: (e) => <span className="text-sm font-medium text-white">{e.name}</span> },
    { key: 'subject', header: 'Subject', render: (e) => <span className="text-sm text-zinc-400">{e.subject?.name ?? '—'}</span> },
    { key: 'class', header: 'Class', render: (e) => <span className="text-sm text-zinc-400">{classLabel(e.class)}</span> },
    { key: 'type', header: 'Type', render: (e) => <span className="text-sm text-zinc-400">{TYPE_LABEL[e.examType] ?? e.examType}</span> },
    { key: 'date', header: 'Date', render: (e) => <span className="text-sm text-zinc-400">{new Date(e.examDate).toLocaleDateString()}</span> },
    { key: 'marks', header: 'Marks', render: (e) => <span className="text-sm text-zinc-400">{e.totalMarks}</span> },
    { key: 'graded', header: 'Graded', render: (e) => <span className="text-sm text-zinc-400">{e._count.grades}</span> },
    {
      key: 'status', header: 'Status',
      render: (e) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          e.isPublished
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
        }`}>
          {e.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (e) => (
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/exams/${e.id}/marks`} title="Enter marks"
            className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
            <ClipboardList className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => handleDelete(e.id)}
            className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Exams & Grades"
        subtitle="Manage exams and enter grades"
        actions={
          <Link href="/dashboard/exams/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> New Exam</Button>
          </Link>
        }
      />

      <div className="flex gap-3">
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
        </select>
      </div>

      <DataTable
        rows={exams}
        columns={columns}
        getId={(e) => e.id}
        loading={loading}
        empty={
          <EmptyState
            icon={BookOpen}
            title="No exams yet"
            description="Create an exam to start entering grades."
            action={<Link href="/dashboard/exams/new"><Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> Create exam</Button></Link>}
          />
        }
      />
    </div>
  );
}
