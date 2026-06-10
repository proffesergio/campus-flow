'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, CalendarX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface AtRiskStudent {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    class: { name: string; section: string | null } | null;
  };
  attendanceRate: number | null;
  avgGrade: number | null;
  reasons: string[];
  level: 'high' | 'medium';
}
interface Summary { total: number; high: number; medium: number }

export default function AtRiskPage() {
  const t = useTranslations('atRisk');

  const [items, setItems] = useState<AtRiskStudent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; items: AtRiskStudent[]; summary: Summary }>('/analytics/at-risk')
      .then((r) => {
        setItems(r.data.items ?? []);
        setSummary(r.data.summary);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" /> {t('title')}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('statFlagged')} value={summary.total} color="text-amber-400" />
          <Stat label={t('statHighRisk')} value={summary.high} color="text-red-400" />
          <Stat label={t('statMediumRisk')} value={summary.medium} color="text-amber-400" />
        </div>
      )}

      {loading && <div className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{t('noAtRisk')}</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.student.id}
            className={`p-4 rounded-xl border flex items-start gap-4 ${
              it.level === 'high' ? 'border-red-800/50 bg-red-950/15' : 'border-amber-800/40 bg-amber-950/10'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white truncate">
                  {it.student.firstName} {it.student.lastName}
                </p>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    it.level === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {it.level}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-2">
                {it.student.class
                  ? `${it.student.class.name}${it.student.class.section ? ` ${it.student.class.section}` : ''}`
                  : '—'}
                {it.student.rollNumber ? ` · ${t('roll')} ${it.student.rollNumber}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {it.reasons.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/70 px-2 py-0.5 rounded">
                    {r.startsWith('Low attendance') ? <CalendarX className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
