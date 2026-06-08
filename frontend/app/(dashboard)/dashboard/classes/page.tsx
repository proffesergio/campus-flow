'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Layers, Users, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface ClassRow {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  capacity: number | null;
  teacher: { id: string; firstName: string; lastName: string } | null;
  _count: { students: number };
}

interface FormState {
  id?: string;
  name: string;
  section: string;
  academicYear: string;
  capacity: string;
}

const emptyForm = (): FormState => ({
  name: '',
  section: '',
  academicYear: String(new Date().getFullYear()),
  capacity: '',
});

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ClassRow[] }>('/classes');
      setClasses(res.data.data ?? []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  function openCreate() { setForm(emptyForm()); setOpen(true); }
  function openEdit(c: ClassRow) {
    setForm({
      id: c.id,
      name: c.name,
      section: c.section ?? '',
      academicYear: c.academicYear,
      capacity: c.capacity != null ? String(c.capacity) : '',
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Class name is required'); return; }
    if (!form.academicYear.trim()) { toast.error('Academic year is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      section: form.section.trim() || undefined,
      academicYear: form.academicYear.trim(),
      capacity: form.capacity ? Number(form.capacity) : undefined,
    };
    try {
      if (form.id) {
        await api.put(`/classes/${form.id}`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/classes', payload);
        toast.success('Class created');
      }
      setOpen(false);
      fetchClasses();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: ClassRow) {
    if (!confirm(`Delete "${c.name}${c.section ? ` – ${c.section}` : ''}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/classes/${c.id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to delete class');
    }
  }

  const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Classes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Create and manage your school&apos;s classes</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {[
          { label: 'Total Classes', value: classes.length, icon: Layers, color: 'text-blue-400' },
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-16 text-center">
          <GraduationCap className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No classes yet</p>
          <p className="text-zinc-600 text-sm mt-1">Add a class so you can enrol students and create exams.</p>
          <Button onClick={openCreate} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add your first class
          </Button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {classes.map((c) => (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -2 }}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {c.name}{c.section ? <span className="text-zinc-400 font-normal"> – {c.section}</span> : null}
                    </p>
                    <p className="text-xs text-zinc-500">{c.academicYear}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {c._count.students} student{c._count.students === 1 ? '' : 's'}
                </span>
                {c.capacity != null && <span>Capacity {c.capacity}</span>}
                {c.teacher && <span className="truncate">CT: {c.teacher.firstName} {c.teacher.lastName}</span>}
              </div>
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
                <DialogTitle className="text-white">{form.id ? 'Edit Class' : 'Add Class'}</DialogTitle>
                <DialogDescription>
                  {form.id ? 'Update the class details.' : 'Create a new class for your school.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Class Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Class 6"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Input
                      value={form.section}
                      onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                      placeholder="e.g. A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Academic Year *</Label>
                    <Input
                      value={form.academicYear}
                      onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                      placeholder="2025"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                      placeholder="40"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="text-zinc-400">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {form.id ? 'Save Changes' : 'Create Class'}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>
    </div>
  );
}
