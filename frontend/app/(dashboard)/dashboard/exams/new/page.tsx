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
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Combobox } from '@/components/ui/combobox';
import { Wizard, WizardStep } from '@/components/ui/wizard';

interface Class { id: string; name: string; section: string | null }
interface Subject { id: string; name: string; classId: string }

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  examType: z.enum(['midterm', 'final', 'quiz', 'assignment', 'class_test']),
  examDate: z.string().min(1, 'Date is required'),
  totalMarks: z.coerce.number().positive('Must be positive'),
  passingMarks: z.coerce.number().positive('Must be positive'),
  term: z.string().min(1, 'Term is required'),
});
type FormData = z.infer<typeof schema>;

const ic = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600';

const STEP_FIELDS: Record<string, (keyof FormData)[]> = {
  details: ['name', 'classId', 'subjectId', 'examType'],
  schedule: ['examDate', 'totalMarks', 'passingMarks', 'term'],
};

export default function NewExamPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { examType: 'midterm' } });

  const values = watch();
  const selectedClassId = values.classId;

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes').then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSubjects([]); return; }
    api.get<{ success: boolean; data: Subject[] }>(`/exams/subjects?classId=${selectedClassId}`)
      .then((r) => setSubjects(r.data.data)).catch(() => {});
  }, [selectedClassId]);

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` – ${c.section}` : ''}` }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  function validateStep(id: string) {
    const fields = STEP_FIELDS[id];
    return fields.length === 0 ? true : trigger(fields);
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await api.post('/exams', { ...data, examDate: new Date(data.examDate).toISOString() });
      toast.success('Exam created');
      router.push('/dashboard/exams');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to create exam');
      setSubmitting(false);
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'details', title: 'Details',
      content: (
        <div className="space-y-4">
          <FormField label="Exam Name" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Mid-Term Mathematics" className={ic} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Class" required error={errors.classId?.message}>
              <Combobox options={classOptions} value={values.classId}
                onChange={(v) => { setValue('classId', v, { shouldValidate: true }); setValue('subjectId', ''); }}
                placeholder="Select class" />
            </FormField>
            <FormField label="Subject" required error={errors.subjectId?.message}>
              <Combobox options={subjectOptions} value={values.subjectId}
                onChange={(v) => setValue('subjectId', v, { shouldValidate: true })}
                placeholder={selectedClassId ? 'Select subject' : 'Pick a class first'} disabled={!selectedClassId} />
            </FormField>
          </div>
          <FormField label="Exam Type" required error={errors.examType?.message}>
            <select {...register('examType')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="class_test">Class Test</option>
            </select>
          </FormField>
        </div>
      ),
    },
    {
      id: 'schedule', title: 'Schedule & Marks',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date" required error={errors.examDate?.message}><Input type="date" {...register('examDate')} className={ic} /></FormField>
            <FormField label="Term" required error={errors.term?.message}><Input {...register('term')} placeholder="e.g. Term 1 2025-26" className={ic} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total Marks" required error={errors.totalMarks?.message}><Input type="number" {...register('totalMarks')} placeholder="100" className={ic} /></FormField>
            <FormField label="Passing Marks" required error={errors.passingMarks?.message}><Input type="number" {...register('passingMarks')} placeholder="40" className={ic} /></FormField>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/exams" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">New Exam</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <Wizard steps={steps} onValidateStep={validateStep} onSubmit={handleSubmit(onSubmit)} submitting={submitting} submitLabel="Create Exam" />
      </div>
    </div>
  );
}
