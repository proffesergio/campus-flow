'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500/80',
  absent: 'bg-red-500/80',
  late: 'bg-yellow-500/80',
  excused: 'bg-blue-500/80',
};

const STATUS_TEXT: Record<string, string> = {
  present: 'text-green-400',
  absent: 'text-red-400',
  late: 'text-yellow-400',
  excused: 'text-blue-400',
};

export default function StudentAttendancePage() {
  const t = useTranslations('student');
  const tStatus = useTranslations('status');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => {
    const from = new Date(year, month, 1).toISOString().split('T')[0];
    const to = new Date(year, month + 1, 0).toISOString().split('T')[0];
    setLoading(true);
    api.get<{ success: boolean; data: AttendanceRecord[] }>(`/attendance/my-history?from=${from}&to=${to}`)
      .then((r) => setRecords(r.data.data ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [year, month]);

  const byDate = records.reduce<Record<string, AttendanceRecord>>((acc, r) => {
    acc[r.date.split('T')[0]] = r;
    return acc;
  }, {});

  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const pct = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dayLabels = [
    t('attendance.daysSun'),
    t('attendance.daysMon'),
    t('attendance.daysTue'),
    t('attendance.daysWed'),
    t('attendance.daysThu'),
    t('attendance.daysFri'),
    t('attendance.daysSat'),
  ];

  const stats = [
    { labelKey: 'attendance.statPresent', value: present, color: 'text-green-400', bg: 'bg-green-500/10' },
    { labelKey: 'attendance.statAbsent', value: absent, color: 'text-red-400', bg: 'bg-red-500/10' },
    { labelKey: 'attendance.statLate', value: late, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { labelKey: 'attendance.statRate', value: pct !== null ? `${pct}%` : '—', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ] as const;

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-green-400" />
        {t('attendance.title')}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.labelKey} className={`${s.bg} border border-zinc-800 rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{t(s.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-white">
            {viewDate.toLocaleString('en-BD', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={nextMonth}
            disabled={viewDate >= new Date()}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {dayLabels.map((d) => (
            <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const rec = byDate[dateStr];
              const today = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <div
                  key={i}
                  title={rec ? `${rec.status}${rec.note ? ` — ${rec.note}` : ''}` : undefined}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-default transition-all
                    ${today ? 'ring-2 ring-indigo-500' : ''}
                    ${rec ? `${STATUS_COLORS[rec.status]} text-white` : 'bg-zinc-800/50 text-zinc-600'}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-zinc-800">
          {Object.entries(STATUS_COLORS).map(([status, bg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${bg}`} />
              <span className="text-xs text-zinc-400">{tStatus(status as 'present' | 'absent' | 'late' | 'excused')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent records */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white text-sm">{t('attendance.thisMonthRecords')}</h3>
        </div>
        {records.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">{t('attendance.noRecords')}</p>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {records
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-zinc-300">
                    {new Date(r.date).toLocaleDateString('en-BD', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className={`text-sm font-medium ${STATUS_TEXT[r.status]}`}>
                    {tStatus(r.status)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
