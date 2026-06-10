'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Class { id: string; name: string; section: string | null }
interface SummaryRow {
  studentId: string; studentName: string; rollNumber: string | null;
  present: number; absent: number; late: number; excused: number; percent: number;
}

const PCT_COLOR = (p: number) =>
  p >= 90 ? 'text-emerald-400' : p >= 75 ? 'text-yellow-400' : 'text-red-400';

export default function AttendanceReportsPage() {
  const t = useTranslations('attendance');

  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; data: Class[] }>('/classes')
      .then((r) => { setClasses(r.data.data); if (r.data.data[0]) setClassId(r.data.data[0].id); })
      .catch(() => {});
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SummaryRow[] }>(
        `/attendance/summary?classId=${classId}&month=${month}`,
      );
      setSummary(res.data.data);
    } catch { toast.error(t('failedLoadSummary')); }
    finally { setLoading(false); }
  }, [classId, month, t]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const headers = [
    t('colStudent'), t('colRoll'), t('colPresent'), t('colAbsent'),
    t('colLate'), t('colExcused'), t('colPercent'),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/attendance"
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('reportsTitle')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('reportsSubtitle')}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` – ${c.section}` : ''}</option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {headers.map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-16 bg-zinc-800" /></td>
                  ))}
                </tr>
              ))
            ) : summary.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 text-sm">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              summary.map((row) => (
                <tr key={row.studentId} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{row.studentName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{row.rollNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400">{row.present}</td>
                  <td className="px-4 py-3 text-sm text-red-400">{row.absent}</td>
                  <td className="px-4 py-3 text-sm text-yellow-400">{row.late}</td>
                  <td className="px-4 py-3 text-sm text-blue-400">{row.excused}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-24 h-1.5 rounded-full bg-zinc-700">
                        <div
                          className={`h-full rounded-full ${row.percent >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(row.percent, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${PCT_COLOR(row.percent)}`}>
                        {row.percent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
