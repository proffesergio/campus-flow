'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('exams');
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
      .then((r) => setSubjects(r.data.data)).catch(() => setSubjects([]));
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
      toast.success(t('examCreated'));
      router.push('/dashboard/exams');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedCreate'));
      setSubmitting(false);
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'details', title: t('stepDetails'),
      content: (
        <div className="space-y-4">
          <FormField label={t('fieldExamName')} required error={errors.name?.message}>
            <Input {...register('name')} placeholder={t('placeholderExamName')} className={ic} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('fieldClass')} required error={errors.classId?.message}>
              <Combobox options={classOptions} value={values.classId}
                onChange={(v) => { setValue('classId', v, { shouldValidate: true }); setValue('subjectId', ''); }}
                placeholder={t('placeholderSelectClass')} />
            </FormField>
            <FormField label={t('fieldSubject')} required error={errors.subjectId?.message}>
              <Combobox options={subjectOptions} value={values.subjectId}
                onChange={(v) => setValue('subjectId', v, { shouldValidate: true })}
                placeholder={selectedClassId ? t('placeholderSelectSubject') : t('placeholderPickClassFirst')} disabled={!selectedClassId} />
            </FormField>
          </div>
          <FormField label={t('fieldExamType')} required error={errors.examType?.message}>
            <select {...register('examType')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
              <option value="midterm">{t('typeLabels.midterm')}</option>
              <option value="final">{t('typeLabels.final')}</option>
              <option value="quiz">{t('typeLabels.quiz')}</option>
              <option value="assignment">{t('typeLabels.assignment')}</option>
              <option value="class_test">{t('typeLabels.class_test')}</option>
            </select>
          </FormField>
        </div>
      ),
    },
    {
      id: 'schedule', title: t('stepSchedule'),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('fieldDate')} required error={errors.examDate?.message}><Input type="date" {...register('examDate')} className={ic} /></FormField>
            <FormField label={t('fieldTerm')} required error={errors.term?.message}><Input {...register('term')} placeholder={t('placeholderTerm')} className={ic} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('fieldTotalMarks')} required error={errors.totalMarks?.message}><Input type="number" {...register('totalMarks')} placeholder={t('placeholderTotalMarks')} className={ic} /></FormField>
            <FormField label={t('fieldPassingMarks')} required error={errors.passingMarks?.message}><Input type="number" {...register('passingMarks')} placeholder={t('placeholderPassingMarks')} className={ic} /></FormField>
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
        <h1 className="text-2xl font-bold text-white">{t('newExamTitle')}</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <Wizard steps={steps} onValidateStep={validateStep} onSubmit={handleSubmit(onSubmit)} submitting={submitting} submitLabel={t('submitCreateExam')} />
      </div>
    </div>
  );
}
