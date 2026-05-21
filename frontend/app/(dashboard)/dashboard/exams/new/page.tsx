'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Class { id: string; name: string; section: string | null }
interface Subject { id: string; name: string; classId: string }

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  examType: z.enum(['midterm', 'final', 'quiz', 'assignment', 'class_test']),
  examDate: z.string().min(1, 'Date is required'),
  totalMarks: z.coerce.number().positive('Must be positive'),
  passingMarks: z.coerce.number().optional(),
  term: z.string().min(1, 'Term is required'),
});
type FormData = z.infer<typeof schema>;

const ic = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600';
const lc = 'text-sm font-medium text-zinc-300';
const ec = 'text-xs text-red-400 mt-1';

export default function NewExamPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedClassId = watch('classId');

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    api.get<{ success: boolean; data: Subject[] }>(`/exams/subjects?classId=${selectedClassId}`)
      .then((r) => setSubjects(r.data.data)).catch(() => {});
  }, [selectedClassId]);

  async function onSubmit(data: FormData) {
    try {
      await api.post('/exams', data);
      toast.success('Exam created');
      router.push('/dashboard/exams');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create exam');
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/exams"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">New Exam</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className={lc}>Exam Name *</label>
            <Input {...register('name')} placeholder="e.g. Mid-Term Mathematics" className={ic} />
            {errors.name && <p className={ec}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={lc}>Class *</label>
              <select {...register('classId')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
                ))}
              </select>
              {errors.classId && <p className={ec}>{errors.classId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={lc}>Subject *</label>
              <select {...register('subjectId')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subjectId && <p className={ec}>{errors.subjectId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={lc}>Exam Type *</label>
              <select {...register('examType')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="class_test">Class Test</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={lc}>Date *</label>
              <Input {...register('examDate')} type="date" className={ic} />
              {errors.examDate && <p className={ec}>{errors.examDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={lc}>Total Marks *</label>
              <Input {...register('totalMarks')} type="number" placeholder="100" className={ic} />
              {errors.totalMarks && <p className={ec}>{errors.totalMarks.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={lc}>Passing Marks</label>
              <Input {...register('passingMarks')} type="number" placeholder="40" className={ic} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={lc}>Term *</label>
            <Input {...register('term')} placeholder="e.g. Term 1 2025-26" className={ic} />
            {errors.term && <p className={ec}>{errors.term.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Creating...' : 'Create Exam'}
            </Button>
            <Link href="/dashboard/exams">
              <Button type="button" variant="ghost" className="text-zinc-400">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
