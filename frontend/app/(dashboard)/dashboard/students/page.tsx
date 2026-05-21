'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, UserCheck, UserPlus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import StudentDrawer from '@/components/students/StudentDrawer';

interface Class { id: string; name: string; section: string | null }
interface Student {
  id: string; firstName: string; lastName: string; rollNumber: string | null;
  status: string; guardianPhone: string | null; guardianName: string | null;
  class: { name: string; section: string | null } | null;
}
interface Stats { total: number; active: number; thisMonth: number }
interface Meta { total: number; page: number; limit: number; totalPages: number }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
  graduated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  transferred: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{
        success: boolean;
        data: Student[];
        meta: Meta;
      }>(`/students?${params}`);
      setStudents(res.data.data ?? []);
      setMeta(res.data.meta);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [page, search, classFilter, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data)).catch(() => {});
    api.get<{ success: boolean; data: Stats }>('/students/stats')
      .then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deactivated');
      fetchStudents();
    } catch { toast.error('Failed to deactivate'); }
  }

  function openCreate() { setEditingStudent(null); setDrawerOpen(true); }
  function openEdit(s: Student) { setEditingStudent(s); setDrawerOpen(true); }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your school&apos;s student records</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: stats?.total, icon: Users, color: 'text-blue-400' },
          { label: 'Active', value: stats?.active, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Enrolled This Month', value: stats?.thisMonth, icon: UserPlus, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, roll, phone..."
            className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Student', 'Class', 'Roll', 'Guardian', 'Status', ''].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24 bg-zinc-800" /></td>
                  ))}
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No students found</p>
                  <button onClick={openCreate} className="text-blue-400 text-sm hover:underline mt-1">
                    Add your first student
                  </button>
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <p className="text-sm font-medium text-white">{s.firstName} {s.lastName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {s.class ? `${s.class.name}${s.class.section ? ` – ${s.class.section}` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.rollNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-zinc-300">{s.guardianName ?? '—'}</p>
                    <p className="text-xs text-zinc-500">{s.guardianPhone ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLE[s.status] ?? STATUS_STYLE.inactive}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/students/${s.id}`}
                        className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)}
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)} className="text-zinc-400">Previous</Button>
          <span className="text-xs text-zinc-500">Page {page} of {meta.totalPages} ({meta.total} students)</span>
          <Button variant="ghost" size="sm" disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)} className="text-zinc-400">Next</Button>
        </div>
      )}

      <StudentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={editingStudent}
        classes={classes}
        onSaved={fetchStudents}
      />
    </div>
  );
}
