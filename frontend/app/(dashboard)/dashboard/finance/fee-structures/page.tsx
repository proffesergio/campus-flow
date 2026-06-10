'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Class { id: string; name: string; section: string | null }

interface FeeStructure {
  id: string; name: string; description: string | null;
  amount: string; currency: string; frequency: string; feeType: string;
  academicYear: string; dueDay: number | null; isActive: boolean;
  class: { name: string; section: string | null } | null;
  _count: { invoices: number };
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  classId: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Must be positive'),
  currency: z.string().default('BDT'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time']),
  feeType: z.enum(['tuition', 'exam', 'admission', 'transport', 'library', 'other']),
  academicYear: z.string().min(1, 'Required'),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
});
type FormData = z.infer<typeof schema>;

function fmt(a: string, currency = 'BDT') {
  const n = parseFloat(a);
  return currency === 'BDT' ? `৳${n.toLocaleString()}` : `${currency} ${n.toLocaleString()}`;
}

export default function FeeStructuresPage() {
  const t = useTranslations('finance');
  const tc = useTranslations('common');

  const FREQ_LABELS: Record<string, string> = {
    monthly: t('freqMonthly'),
    quarterly: t('freqQuarterly'),
    annual: t('freqAnnual'),
    one_time: t('freqOneTime'),
  };

  const TYPE_LABEL_KEYS = ['tuition', 'exam', 'admission', 'transport', 'library', 'other'] as const;

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);

  const {
    register, handleSubmit, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<{ success: boolean; data: FeeStructure[] }>('/finance/fee-structures');
      setStructures(r.data.data ?? []);
    } catch { toast.error(t('failedLoad')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchStructures(); }, [fetchStructures]);
  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  function openDrawer(fs?: FeeStructure) {
    setEditing(fs ?? null);
    if (fs) {
      reset({
        name: fs.name, description: fs.description ?? '',
        amount: parseFloat(fs.amount), currency: fs.currency,
        frequency: fs.frequency as FormData['frequency'],
        feeType: fs.feeType as FormData['feeType'],
        academicYear: fs.academicYear,
        dueDay: fs.dueDay ?? undefined,
      });
    } else {
      reset({ currency: 'BDT', frequency: 'monthly', feeType: 'tuition' });
    }
    setDrawerOpen(true);
  }

  async function onSubmit(data: FormData) {
    try {
      const payload = { ...data, classId: data.classId || null };
      if (editing) {
        await api.put(`/finance/fee-structures/${editing.id}`, payload);
        toast.success(t('structureUpdated'));
      } else {
        await api.post('/finance/fee-structures', payload);
        toast.success(t('structureCreated'));
      }
      setDrawerOpen(false);
      fetchStructures();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('failedSave'));
    }
  }

  async function handleDelete(id: string, invoiceCount: number) {
    if (invoiceCount > 0) {
      toast.error(t('cannotDelete', { count: invoiceCount }));
      return;
    }
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/finance/fee-structures/${id}`);
      toast.success(t('deleted'));
      fetchStructures();
    } catch { toast.error(t('failedDelete')); }
  }

  const inputClass = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500';
  const labelClass = 'text-sm font-medium text-zinc-300';
  const errorClass = 'text-xs text-red-400 mt-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/finance">
            <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('feeStructuresTitle')}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{t('feeStructuresSubtitle')}</p>
          </div>
        </div>
        <Button onClick={() => openDrawer()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> {t('newStructure')}
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {[
                t('colName'), t('colType'), t('colFrequency'), t('colAmount'),
                t('colClass'), t('colAcademicYear'), t('colInvoices'), '',
              ].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20 bg-zinc-800" /></td>
                  ))}
                </tr>
              ))
            ) : structures.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">{t('noFeeStructures')}</p>
                  <button onClick={() => openDrawer()} className="text-blue-400 text-sm hover:underline mt-1">
                    {t('createFirstFeeStructure')}
                  </button>
                </td>
              </tr>
            ) : (
              structures.map((fs) => (
                <tr key={fs.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{fs.name}</p>
                    {fs.description && <p className="text-xs text-zinc-500 truncate max-w-40">{fs.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{t(`typeLabels.${fs.feeType}` as `typeLabels.${typeof TYPE_LABEL_KEYS[number]}`) ?? fs.feeType}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{FREQ_LABELS[fs.frequency] ?? fs.frequency}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{fmt(fs.amount, fs.currency)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {fs.class ? `${fs.class.name}${fs.class.section ? ` – ${fs.class.section}` : ''}` : t('allClasses')}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{fs.academicYear}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{fs._count.invoices}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDrawer(fs)}
                        className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(fs.id, fs._count.invoices)}
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

      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                {editing ? t('editFeeStructure') : t('newFeeStructure')}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('fieldName')} *</label>
                  <Input {...register('name')} placeholder={t('placeholderName')} className={inputClass} />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('fieldDescription')}</label>
                  <Input {...register('description')} placeholder={t('placeholderDescription')} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldAmount')} *</label>
                    <Input {...register('amount')} type="number" min={1} placeholder={t('placeholderAmount')} className={inputClass} />
                    {errors.amount && <p className={errorClass}>{errors.amount.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldCurrency')}</label>
                    <Input {...register('currency')} defaultValue="BDT" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldFrequency')} *</label>
                    <Select onValueChange={(v) => setValue('frequency', v as FormData['frequency'])}>
                      <SelectTrigger className={`w-full ${inputClass}`}>
                        <SelectValue placeholder={tc('filter')} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="monthly" className="text-zinc-300">{t('freqMonthly')}</SelectItem>
                        <SelectItem value="quarterly" className="text-zinc-300">{t('freqQuarterly')}</SelectItem>
                        <SelectItem value="annual" className="text-zinc-300">{t('freqAnnual')}</SelectItem>
                        <SelectItem value="one_time" className="text-zinc-300">{t('freqOneTime')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldFeeType')} *</label>
                    <Select onValueChange={(v) => setValue('feeType', v as FormData['feeType'])}>
                      <SelectTrigger className={`w-full ${inputClass}`}>
                        <SelectValue placeholder={tc('filter')} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        {TYPE_LABEL_KEYS.map((k) => (
                          <SelectItem key={k} value={k} className="text-zinc-300">
                            {t(`typeLabels.${k}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldAcademicYear')} *</label>
                    <Input {...register('academicYear')} placeholder={t('placeholderAcademicYear')} className={inputClass} />
                    {errors.academicYear && <p className={errorClass}>{errors.academicYear.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t('fieldDueDay')}</label>
                    <Input {...register('dueDay')} type="number" min={1} max={31} placeholder={t('placeholderDueDay')} className={inputClass} />
                    <p className="text-xs text-zinc-600">{t('fieldDueDayHint')}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t('fieldClass')}</label>
                  <Select onValueChange={(v) => setValue('classId', v === 'all' ? '' : v)}>
                    <SelectTrigger className={`w-full ${inputClass}`}>
                      <SelectValue placeholder={t('allClasses')} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all" className="text-zinc-300">{t('allClasses')}</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-zinc-300">
                          {c.name}{c.section ? ` – ${c.section}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? t('saving') : editing ? tc('update') : tc('create')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)} className="flex-1 text-zinc-400">
                    {tc('cancel')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
