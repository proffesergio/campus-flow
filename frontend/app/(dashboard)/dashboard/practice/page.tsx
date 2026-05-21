'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, BookMarked, FileText, Link2, Video, StickyNote,
  Download, Trash2, Search, ExternalLink, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function PracticePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', type: 'pdf',
    fileUrl: '', classId: '', subjectId: '', isPublished: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get<{ success: boolean; data: Material[] }>(
        `/practice-materials?${params}`,
      );
      setMaterials(res.data.data ?? []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, typeFilter]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classFilter) { setSubjects([]); return; }
    api.get<{ success: boolean; data: Subject[] }>(`/exams/subjects?classId=${classFilter}`)
      .then((r) => setSubjects(r.data.data ?? [])).catch(() => {});
  }, [classFilter]);

  async function handleSave() {
    if (!form.title.trim() || !form.fileUrl.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/practice-materials', {
        ...form,
        classId: form.classId || null,
        subjectId: form.subjectId || null,
        description: form.description || null,
      });
      toast.success('Material added');
      setDrawerOpen(false);
      setForm({ title: '', description: '', type: 'pdf', fileUrl: '', classId: '', subjectId: '', isPublished: true });
      fetchMaterials();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to save material');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this material?')) return;
    try {
      await api.delete(`/practice-materials/${id}`);
      toast.success('Deleted');
      fetchMaterials();
    } catch { toast.error('Failed to delete'); }
  }

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
  const fadeUp  = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  const inputCls = 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Practice Materials</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Upload study resources for students</p>
          </div>
        </div>
        <Button onClick={() => setDrawerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className={`pl-9 ${inputCls}`}
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="link">Link</option>
          <option value="video">Video</option>
          <option value="note">Note</option>
        </select>
      </div>

      {/* Materials grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-20 text-center">
          <Upload className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No practice materials yet</p>
          <button onClick={() => setDrawerOpen(true)} className="text-blue-400 text-sm hover:underline mt-1">
            Add the first material
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
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
                      {m.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {m.class && (
                      <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">
                        {m.class.name}{m.class.section ? ` – ${m.class.section}` : ''}
                      </span>
                    )}
                    {m.subject && (
                      <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400">
                        {m.subject.name}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${meta.bg} ${meta.color}`}>
                      {m.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <p className="text-xs text-zinc-600">
                      {m.uploadedBy.firstName} {m.uploadedBy.lastName}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                        {m.type === 'pdf' ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      </a>
                      <button onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
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

      {/* Add material drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Add Practice Material</h2>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Title *</label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 5 – Photosynthesis" className={inputCls} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional short description" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Type *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                    <option value="pdf">PDF</option>
                    <option value="link">Link</option>
                    <option value="video">Video</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Published</label>
                  <div className="h-10 flex items-center">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-blue-600' : 'bg-zinc-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.isPublished ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="ml-2 text-sm text-zinc-400">{form.isPublished ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  {form.type === 'pdf' ? 'File URL *' : 'URL *'}
                </label>
                <Input value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                  placeholder={form.type === 'pdf' ? 'https://...' : 'https://youtube.com/...'}
                  className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Class</label>
                  <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, subjectId: '' }))}
                    className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                    <option value="">All classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Subject</label>
                  <select value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                    className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
                    <option value="">All subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? 'Saving...' : 'Add Material'}
                </Button>
                <Button variant="ghost" onClick={() => setDrawerOpen(false)} className="flex-1 text-zinc-400">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
