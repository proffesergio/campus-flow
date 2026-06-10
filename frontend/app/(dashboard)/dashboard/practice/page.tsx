'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Plus, BookMarked, FileText, Link2, Video, StickyNote,
  Download, Trash2, Search, ExternalLink, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/components/ui/form-field';
import { Combobox } from '@/components/ui/combobox';
import { Wizard, WizardStep } from '@/components/ui/wizard';

interface Class { id: string; name: string; section: string | null }
interface Subject { id: string; name: string }
interface Material {
  id: string; title: string; description: string | null;
  type: string; fileUrl: string; isPublished: boolean;
  subject: { name: string } | null;
  class: { name: string; section: string | null } | null;
  uploadedBy: { firstName: string; lastName: string };
  createdAt: string;
}

const TYPE_META: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  pdf:   { icon: FileText, color: 'text-red-400',    bg: 'bg-red-500/10' },
  link:  { icon: Link2,    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  video: { icon: Video,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
  note:  { icon: StickyNote,color: 'text-yellow-400',bg: 'bg-yellow-500/10' },
};

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  type: z.enum(['pdf', 'link', 'video', 'note']),
  fileUrl: z.string().min(1, 'Required'),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  isPublished: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const STEP_FIELDS: Record<string, (keyof FormData)[]> = {
  details: ['title', 'fileUrl', 'type'],
  targeting: [],
};

const inputCls = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500';

export default function PracticePage() {
  const t = useTranslations('practice');

  const [materials, setMaterials] = useState<Material[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formSubjects, setFormSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { type: 'pdf', isPublished: true } });
  const values = watch();

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get<{ success: boolean; data: Material[] }>(`/practice-materials?${params}`);
      setMaterials(res.data.data ?? []);
    } catch { setMaterials([]); }
    finally { setLoading(false); }
  }, [search, classFilter, typeFilter]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data ?? [])).catch(() => {});
  }, []);

  // Subjects for the FORM's class (not the list filter).
  const formClassId = values.classId;
  useEffect(() => {
    if (!formClassId) { setFormSubjects([]); return; }
    api.get<{ success: boolean; data: Subject[] }>(`/exams/subjects?classId=${formClassId}`)
      .then((r) => setFormSubjects(r.data.data ?? [])).catch(() => setFormSubjects([]));
  }, [formClassId]);

  function openCreate() {
    reset({ title: '', description: '', type: 'pdf', fileUrl: '', classId: '', subjectId: '', isPublished: true });
    setDrawerOpen(true);
  }
  function validateStep(id: string) {
    const fields = STEP_FIELDS[id];
    return fields.length === 0 ? true : trigger(fields);
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      await api.post('/practice-materials', {
        ...data,
        classId: data.classId || null,
        subjectId: data.subjectId || null,
        description: data.description || null,
      });
      toast.success(t('materialAdded'));
      setDrawerOpen(false);
      fetchMaterials();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedSave'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/practice-materials/${id}`);
      toast.success(t('deleted'));
      fetchMaterials();
    } catch { toast.error(t('failedDelete')); }
  }

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name}${c.section ? ` – ${c.section}` : ''}` }));
  const subjectOptions = formSubjects.map((s) => ({ value: s.id, label: s.name }));

  const steps: WizardStep[] = [
    {
      id: 'details', title: t('stepDetails'),
      content: (
        <div className="space-y-4">
          <FormField label={t('fieldTitle')} required error={errors.title?.message}>
            <Input {...register('title')} placeholder={t('placeholderTitle')} className={inputCls} />
          </FormField>
          <FormField label={t('fieldDescription')} error={errors.description?.message}>
            <Input {...register('description')} placeholder={t('placeholderDescription')} className={inputCls} />
          </FormField>
          <FormField label={t('fieldType')} required error={errors.type?.message}>
            <select {...register('type')} className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
              <option value="pdf">{t('typePdf')}</option>
              <option value="link">{t('typeLink')}</option>
              <option value="video">{t('typeVideo')}</option>
              <option value="note">{t('typeNote')}</option>
            </select>
          </FormField>
          <FormField label={values.type === 'pdf' ? t('fieldFileUrl') : t('fieldUrl')} required error={errors.fileUrl?.message}>
            <Input {...register('fileUrl')} placeholder={values.type === 'pdf' ? t('placeholderFileUrl') : t('placeholderUrl')} className={inputCls} />
          </FormField>
        </div>
      ),
    },
    {
      id: 'targeting', title: t('stepTargeting'),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('fieldClass')} error={errors.classId?.message}>
              <Combobox options={classOptions} value={values.classId}
                onChange={(v) => { setValue('classId', v); setValue('subjectId', ''); }} placeholder={t('placeholderAllClasses')} />
            </FormField>
            <FormField label={t('fieldSubject')} error={errors.subjectId?.message}>
              <Combobox options={subjectOptions} value={values.subjectId}
                onChange={(v) => setValue('subjectId', v)} placeholder={formClassId ? t('placeholderAllSubjects') : t('placeholderPickClassFirst')} disabled={!formClassId} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isPublished')} className="rounded border-zinc-600" />
            <span className="text-sm text-zinc-300">{t('fieldPublished')}</span>
          </label>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> {t('addMaterial')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className={`pl-9 ${inputCls}`} />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">{t('allClasses')}</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">{t('allTypes')}</option>
          <option value="pdf">{t('typePdf')}</option>
          <option value="link">{t('typeLink')}</option>
          <option value="video">{t('typeVideo')}</option>
          <option value="note">{t('typeNote')}</option>
        </select>
      </div>

      {/* Materials grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 bg-zinc-800 rounded-xl" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-20 text-center">
          <Upload className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">{t('noMaterials')}</p>
          <button onClick={openCreate} className="text-blue-400 text-sm hover:underline mt-1">{t('addFirstMaterial')}</button>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => {
            const meta = TYPE_META[m.type] ?? TYPE_META.pdf;
            const Icon = meta.icon;
            return (
              <motion.div key={m.id} variants={fadeUp}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-600 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{m.title}</p>
                      {m.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{m.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.class && <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">{m.class.name}{m.class.section ? ` – ${m.class.section}` : ''}</span>}
                    {m.subject && <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">{m.subject.name}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${meta.bg} ${meta.color}`}>{m.type}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <p className="text-xs text-zinc-600">{m.uploadedBy.firstName} {m.uploadedBy.lastName}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                        {m.type === 'pdf' ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      </a>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add material drawer (wizard) */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => !submitting && setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">{t('drawerTitle')}</h2>
              <Wizard steps={steps} onValidateStep={validateStep} onSubmit={handleSubmit(onSubmit)} submitting={submitting} submitLabel={t('submitAddMaterial')} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
