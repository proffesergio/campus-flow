'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Plus, Search, Users, UserCheck, UserPlus, Pencil, Trash2, Eye,
  Upload, Download, Power, ArrowRightLeft, Send, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import StudentDrawer from '@/components/students/StudentDrawer';
import StudentImportDialog from '@/components/students/StudentImportDialog';
import { toCsv, downloadCsv } from '@/lib/csv';

interface Class { id: string; name: string; section: string | null }
interface Student {
  id: string; firstName: string; lastName: string; rollNumber: string | null;
  photoUrl: string | null;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  guardianPhone: string; guardianName?: string | null;
  class: { id: string; name: string; section: string | null };
}
interface Stats { total: number; active: number; thisMonth: number }
interface Meta { total: number; page: number; limit: number; totalPages: number }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
  graduated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  transferred: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function classLabel(c: { name: string; section: string | null } | null) {
  return c ? `${c.name}${c.section ? ` – ${c.section}` : ''}` : '';
}

function exportStudents(rows: Student[]) {
  const flat = rows.map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    className: classLabel(s.class),
    rollNumber: s.rollNumber ?? '',
    guardianName: s.guardianName ?? '',
    guardianPhone: s.guardianPhone ?? '',
    status: s.status,
  }));
  const csv = toCsv(flat, [
    { key: 'firstName', header: 'firstName' },
    { key: 'lastName', header: 'lastName' },
    { key: 'className', header: 'className' },
    { key: 'rollNumber', header: 'rollNumber' },
    { key: 'guardianName', header: 'guardianName' },
    { key: 'guardianPhone', header: 'guardianPhone' },
    { key: 'status', header: 'status' },
  ]);
  downloadCsv(`students-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export default function StudentsPage() {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const ts = useTranslations('status');

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
  const [importOpen, setImportOpen] = useState(false);

  // Selection + bulk dialogs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveClassId, setMoveClassId] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeSubject, setNoticeSubject] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    // Selection only applies to the visible page; clear it whenever the list reloads
    // (filter/page change or a post-action refetch) so bulk ops never hit off-screen rows.
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      if (statusFilter) params.set('status', statusFilter);
      // /students returns { success, items, meta } — items, not data.
      const res = await api.get<{ success: boolean; items: Student[]; meta: Meta }>(`/students?${params}`);
      setStudents(res.data.items ?? []);
      setMeta(res.data.meta);
    } catch { toast.error(t('failedLoad')); }
    finally { setLoading(false); }
  }, [page, search, classFilter, statusFilter, t]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => setClasses(r.data.data)).catch(() => {});
    api.get<{ success: boolean; data: Stats }>('/students/stats')
      .then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  // Open create drawer when arrived via the +New quick-add (?new=1).
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('new') === '1') {
      setEditingStudent(null);
      setDrawerOpen(true);
    }
  }, []);

  function openCreate() { setEditingStudent(null); setDrawerOpen(true); }
  function openEdit(s: Student) { setEditingStudent(s); setDrawerOpen(true); }
  function clearSelection() { setSelectedIds(new Set()); }
  const selectedStudents = students.filter((s) => selectedIds.has(s.id));

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDeactivate'))) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success(t('deactivated'));
      fetchStudents();
    } catch { toast.error(t('failedDeactivate')); }
  }

  async function bulkDeactivate() {
    if (!confirm(t('confirmBulkDeactivate', { count: selectedIds.size }))) return;
    setBulkBusy(true);
    try {
      const res = await api.post<{ success: boolean; data: { affected: number } }>('/students/bulk', {
        action: 'deactivate', ids: [...selectedIds],
      });
      toast.success(t('bulkDeactivated', { count: res.data.data.affected }));
      clearSelection();
      fetchStudents();
    } catch { toast.error(t('bulkActionFailed')); }
    finally { setBulkBusy(false); }
  }

  async function bulkMove() {
    if (!moveClassId) { toast.error(t('pickClass')); return; }
    setBulkBusy(true);
    try {
      const res = await api.post<{ success: boolean; data: { affected: number } }>('/students/bulk', {
        action: 'move-class', ids: [...selectedIds], classId: moveClassId,
      });
      toast.success(t('moved', { count: res.data.data.affected }));
      setMoveOpen(false); setMoveClassId(''); clearSelection();
      fetchStudents();
    } catch { toast.error(t('moveFailed')); }
    finally { setBulkBusy(false); }
  }

  async function bulkNotify() {
    if (!noticeSubject.trim() || !noticeMessage.trim()) { toast.error(t('subjectRequired')); return; }
    setBulkBusy(true);
    try {
      const res = await api.post<{ success: boolean; data: { sent: number } }>('/notifications/notify-students', {
        studentIds: [...selectedIds], subject: noticeSubject.trim(), message: noticeMessage.trim(), channels: ['in_app'],
      });
      toast.success(t('noticeSent', { count: res.data.data.sent }));
      setNoticeOpen(false); setNoticeSubject(''); setNoticeMessage(''); clearSelection();
    } catch { toast.error(t('noticeFailed')); }
    finally { setBulkBusy(false); }
  }

  const columns: Column<Student>[] = [
    {
      key: 'student', header: t('name'),
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {s.firstName[0]}{s.lastName[0]}
          </div>
          <p className="text-sm font-medium text-white">{s.firstName} {s.lastName}</p>
        </div>
      ),
    },
    { key: 'class', header: t('class'), render: (s) => <span className="text-sm text-zinc-400">{classLabel(s.class) || '—'}</span> },
    { key: 'roll', header: t('rollNumber'), render: (s) => <span className="text-sm text-zinc-400">{s.rollNumber ?? '—'}</span> },
    {
      key: 'guardian', header: t('guardianName'),
      render: (s) => (
        <div>
          <p className="text-sm text-zinc-300">{s.guardianName ?? '—'}</p>
          <p className="text-xs text-zinc-500">{s.guardianPhone ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'status', header: tc('status'),
      render: (s) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLE[s.status] ?? STATUS_STYLE.inactive}`}>
          {ts(s.status as Parameters<typeof ts>[0])}
        </span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (s) => (
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/students/${s.id}`} className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => openEdit(s)} className="p-1.5 rounded text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(true)} className="text-zinc-300 gap-2">
              <Upload className="w-4 h-4" /> {tc('import')}
            </Button>
            <Button variant="ghost" onClick={() => exportStudents(students)} disabled={students.length === 0} className="text-zinc-300 gap-2">
              <Download className="w-4 h-4" /> {tc('export')}
            </Button>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> {t('addStudent')}
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('totalStudents'), value: stats?.total, icon: Users, color: 'text-blue-400' },
          { label: t('active'), value: stats?.active, icon: UserCheck, color: 'text-emerald-400' },
          { label: t('enrolledThisMonth'), value: stats?.thisMonth, icon: UserPlus, color: 'text-purple-400' },
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
            placeholder={t('searchPlaceholder')}
            className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
          />
        </div>
        <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">{t('allClasses')}</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
          <option value="">{t('allStatuses')}</option>
          <option value="active">{ts('active')}</option>
          <option value="inactive">{ts('inactive')}</option>
          <option value="graduated">{ts('graduated')}</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        rows={students}
        columns={columns}
        getId={(s) => s.id}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        empty={
          <EmptyState
            icon={Users}
            title={t('noStudents')}
            description={t('noStudentsDesc')}
            action={<Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> {t('addStudent')}</Button>}
          />
        }
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-zinc-400">{tc('previous')}</Button>
          <span className="text-xs text-zinc-500">{tc('page')} {page} {tc('of')} {meta.totalPages} ({meta.total} {t('title').toLowerCase()})</span>
          <Button variant="ghost" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="text-zinc-400">{tc('next')}</Button>
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar count={selectedIds.size} onClear={clearSelection}>
        <Button size="sm" variant="ghost" onClick={bulkDeactivate} disabled={bulkBusy} className="text-zinc-200 gap-1.5">
          <Power className="w-3.5 h-3.5" /> {t('deactivate')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => exportStudents(selectedStudents)} className="text-zinc-200 gap-1.5">
          <Download className="w-3.5 h-3.5" /> {tc('export')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setMoveOpen(true)} className="text-zinc-200 gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5" /> {t('moveClass')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setNoticeOpen(true)} className="text-zinc-200 gap-1.5">
          <Send className="w-3.5 h-3.5" /> {t('sendNotice')}
        </Button>
      </BulkActionBar>

      {/* Move class dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">{t('moveClassTitle', { count: selectedIds.size })}</DialogTitle>
            <DialogDescription>{t('moveClassDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{t('class')}</Label>
            <select value={moveClassId} onChange={(e) => setMoveClassId(e.target.value)}
              className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white">
              <option value="">{t('selectClass')}</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMoveOpen(false)} className="text-zinc-400">{tc('cancel')}</Button>
            <Button onClick={bulkMove} disabled={bulkBusy || !moveClassId} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {bulkBusy && <Loader2 className="w-4 h-4 animate-spin" />} {t('moveClass')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send notice dialog */}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">{t('sendNoticeTitle', { count: selectedIds.size })}</DialogTitle>
            <DialogDescription>{t('sendNoticeDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('noticeSubject')}</Label>
              <Input value={noticeSubject} onChange={(e) => setNoticeSubject(e.target.value)} placeholder={t('subjectPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('noticeMessage')}</Label>
              <textarea value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} rows={4}
                placeholder={t('noticePlaceholder')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoticeOpen(false)} className="text-zinc-400">{tc('cancel')}</Button>
            <Button onClick={bulkNotify} disabled={bulkBusy || !noticeSubject || !noticeMessage} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {bulkBusy && <Loader2 className="w-4 h-4 animate-spin" />} {t('sendNotice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} student={editingStudent} onSuccess={fetchStudents} />
      <StudentImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={() => { fetchStudents(); }} />
    </div>
  );
}
