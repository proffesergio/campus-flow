'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Pencil, Trash2, Loader2, Library } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface ClassRow { id: string; name: string; section: string | null }
interface Subject {
  id: string;
  name: string;
  code: string | null;
  creditHours: number | null;
  teacher: { firstName: string; lastName: string } | null;
  _count: { exams: number };
}

interface FormState { id?: string; name: string; code: string; creditHours: string }
const emptyForm = (): FormState => ({ name: '', code: '', creditHours: '' });

function classLabel(c: ClassRow) {
  return `${c.name}${c.section ? ` – ${c.section}` : ''}`;
}

export default function SubjectsPage() {
  const t = useTranslations('subjects');
  const tc = useTranslations('common');

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    api.get<{ success: boolean; data: ClassRow[] }>('/classes')
      .then((r) => {
        const list = r.data.data ?? [];
        setClasses(list);
        if (list.length > 0) setClassId(list[0].id);
      })
      .catch(() => toast.error(t('failedLoadClasses')))
      .finally(() => setLoadingClasses(false));
  }, [t]);

  const fetchSubjects = useCallback(async () => {
    if (!classId) { setSubjects([]); return; }
    setLoadingSubjects(true);
    try {
      const res = await api.get<{ success: boolean; data: Subject[] }>(`/exams/subjects?classId=${classId}`);
      setSubjects(res.data.data ?? []);
    } catch {
      toast.error(t('failedLoad'));
    } finally {
      setLoadingSubjects(false);
    }
  }, [classId, t]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  // Auto-open the create dialog when arrived via the +New quick-add (?new=1).
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1') {
      setForm(emptyForm());
      setOpen(true);
    }
  }, []);

  function openCreate() { setForm(emptyForm()); setOpen(true); }
  function openEdit(s: Subject) {
    setForm({ id: s.id, name: s.name, code: s.code ?? '', creditHours: s.creditHours != null ? String(s.creditHours) : '' });
    setOpen(true);
  }

  async function handleSave() {
    if (!classId) { toast.error(t('selectClassFirst')); return; }
    if (!form.name.trim()) { toast.error(t('nameRequired')); return; }
    setSaving(true);
    const base = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      creditHours: form.creditHours ? Number(form.creditHours) : undefined,
    };
    try {
      if (form.id) {
        await api.put(`/exams/subjects/${form.id}`, base);
        toast.success(t('subjectUpdated'));
      } else {
        await api.post('/exams/subjects', { ...base, classId });
        toast.success(t('subjectCreated'));
      }
      setOpen(false);
      fetchSubjects();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Subject) {
    if (!confirm(t('confirmDelete', { name: s.name }))) return;
    try {
      await api.delete(`/exams/subjects/${s.id}`);
      toast.success(t('subjectDeleted'));
      fetchSubjects();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedDelete'));
    }
  }

  const currentClass = classes.find((c) => c.id === classId);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button onClick={openCreate} disabled={!classId} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> {t('addSubject')}
          </Button>
        }
      />

      {/* Class selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-zinc-400">{t('classLabel')}</Label>
        {loadingClasses ? (
          <Skeleton className="h-10 w-48 bg-zinc-800" />
        ) : classes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {t('noClassesYet')}{' '}
            <a href="/dashboard/classes" className="text-blue-400 hover:underline">{t('noClassesYetLink')}</a>
            {' '}{t('noClassesYetSuffix')}
          </p>
        ) : (
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white min-w-48"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{classLabel(c)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Subjects grid */}
      {loadingSubjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      ) : !classId ? null : subjects.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-16 text-center">
          <Library className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">{t('noSubjects')}</p>
          <p className="text-zinc-600 text-sm mt-1">{t('noSubjectsDesc')}</p>
          <Button onClick={openCreate} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> {t('addFirstSubject')}
          </Button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {subjects.map((s) => (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/15 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500">
                      {s.code ? s.code : t('noCode')}{s.creditHours != null ? ` · ${t('creditHours', { count: s.creditHours })}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)}
                    className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s._count.exams > 0 && (
                <p className="text-xs text-zinc-600 mt-3">{t('exams', { count: s._count.exams })}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-white">{form.id ? t('editSubjectTitle') : t('addSubjectTitle')}</DialogTitle>
                <DialogDescription>
                  {form.id
                    ? t('editSubjectDesc')
                    : t('addSubjectDesc', { className: currentClass ? classLabel(currentClass) : 'this class' })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('subjectName')} *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Mathematics"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('code')}</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder="e.g. MATH"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('creditHoursLabel')}</Label>
                    <Input
                      type="number"
                      value={form.creditHours}
                      onChange={(e) => setForm((f) => ({ ...f, creditHours: e.target.value }))}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="text-zinc-400">
                  {tc('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {form.id ? t('submitSave') : t('submitCreate')}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>
    </div>
  );
}
