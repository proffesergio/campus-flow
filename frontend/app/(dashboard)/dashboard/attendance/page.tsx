'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, BookOpen, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Class { id: string; name: string; section: string | null }
interface AttendanceRecord {
  student: { id: string; firstName: string; lastName: string; rollNumber: string | null };
  status: string | null; note: string | null;
}

type Status = 'present' | 'absent' | 'late' | 'excused';

export default function AttendancePage() {
  const t = useTranslations('attendance');
  const ts = useTranslations('status');

  const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
    present: { label: ts('present'), color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' },
    absent:  { label: ts('absent'),  color: 'text-red-400',     bg: 'bg-red-500/20 border-red-500/40'         },
    late:    { label: ts('late'),    color: 'text-yellow-400',  bg: 'bg-yellow-500/20 border-yellow-500/40'   },
    excused: { label: ts('excused'), color: 'text-blue-400',    bg: 'bg-blue-500/20 border-blue-500/40'       },
  };

  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => {
        setClasses(r.data.data);
        if (r.data.data.length > 0) setClassId(r.data.data[0].id);
      }).catch(() => {});
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: AttendanceRecord[] }>(
        `/attendance?classId=${classId}&date=${date}`,
      );
      const data = res.data.data;
      setRecords(data);
      const marked = data.some((r) => r.status !== null);
      setAlreadyMarked(marked);
      const initial: Record<string, Status> = {};
      data.forEach((r) => {
        initial[r.student.id] = (r.status as Status) ?? 'present';
      });
      setStatuses(initial);
    } catch { toast.error(t('failedLoad')); }
    finally { setLoading(false); }
  }, [classId, date, t]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  function setStatus(studentId: string, status: Status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  async function saveAttendance() {
    if (!classId || records.length === 0) return;
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        classId,
        date,
        records: records.map((r) => ({
          studentId: r.student.id,
          status: statuses[r.student.id] ?? 'present',
        })),
      });
      toast.success(t('saved'));
      setAlreadyMarked(true);
    } catch { toast.error(t('failedSave')); }
    finally { setSaving(false); }
  }

  const markedCount = Object.keys(statuses).length;
  const presentCount = Object.values(statuses).filter((s) => s === 'present').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white min-w-40"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        />
        {alreadyMarked && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
            <BookOpen className="w-3.5 h-3.5" /> {t('alreadyMarked')}
          </span>
        )}
        {markedCount > 0 && (
          <span className="text-xs text-zinc-500 ml-auto">
            {t('presentCount', { present: presentCount, total: markedCount })}
          </span>
        )}
      </div>

      {/* Student list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full bg-zinc-800" />
                <Skeleton className="h-4 w-40 bg-zinc-800" />
                <div className="ml-auto flex gap-2">
                  {[0, 1, 2, 3].map((j) => <Skeleton key={j} className="h-8 w-20 bg-zinc-800 rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500">{t('noStudents')}</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {records.map((record) => {
              const current = statuses[record.student.id] ?? 'present';
              return (
                <div key={record.student.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {record.student.firstName[0]}{record.student.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">
                      {record.student.firstName} {record.student.lastName}
                    </p>
                    {record.student.rollNumber && (
                      <p className="text-xs text-zinc-500">Roll #{record.student.rollNumber}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(record.student.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          current === s
                            ? STATUS_CONFIG[s].bg + ' ' + STATUS_CONFIG[s].color
                            : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-600'
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {records.length > 0 && (
        <div className="flex justify-end gap-3">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([s, cfg]) => (
              <span key={s} className="flex items-center gap-1.5">
                {s === 'present' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                 s === 'absent'  ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
                 <Clock className="w-3.5 h-3.5 text-yellow-400" />}
                {Object.values(statuses).filter((v) => v === s).length} {cfg.label}
              </span>
            ))}
          </div>
          <Button onClick={saveAttendance} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Save className="w-4 h-4" />
            {saving ? t('saving') : alreadyMarked ? t('updateAttendance') : t('saveAttendance')}
          </Button>
        </div>
      )}
    </div>
  );
}
