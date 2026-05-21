'use client';

import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Exam {
  id: string;
  name: string;
  examType: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  term: string;
  subject?: { name: string };
}

const TYPE_COLORS: Record<string, string> = {
  midterm: 'bg-blue-500/20 text-blue-400',
  final: 'bg-purple-500/20 text-purple-400',
  quiz: 'bg-green-500/20 text-green-400',
  assignment: 'bg-amber-500/20 text-amber-400',
  'class-test': 'bg-pink-500/20 text-pink-400',
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(diff / 86400000);
  if (days === 0) return { label: 'Today', color: 'text-red-400' };
  if (days === 1) return { label: 'Tomorrow', color: 'text-amber-400' };
  if (days < 0) return { label: `${Math.abs(days)}d ago`, color: 'text-zinc-500' };
  return { label: `In ${days} days`, color: days <= 3 ? 'text-amber-400' : 'text-zinc-400' };
}

export default function StudentExamsPage() {
  const [upcoming, setUpcoming] = useState<Exam[]>([]);
  const [past, setPast] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    Promise.allSettled([
      api.get<{ success: boolean; data: Exam[] }>('/exams/my?upcoming=true'),
      api.get<{ success: boolean; data: Exam[] }>('/exams/my?past=true'),
    ]).then(([upRes, pastRes]) => {
      if (upRes.status === 'fulfilled') setUpcoming(upRes.value.data.data ?? []);
      if (pastRes.status === 'fulfilled') setPast(pastRes.value.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-blue-400" />
        Exam Schedule
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg w-fit">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t} {t === 'upcoming' ? `(${upcoming.length})` : `(${past.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No {tab} exams</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((exam, i) => {
            const until = daysUntil(exam.examDate);
            const typeClass = TYPE_COLORS[exam.examType] ?? 'bg-zinc-700 text-zinc-400';
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
              >
                {/* Date badge */}
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-white leading-none">
                    {new Date(exam.examDate).getDate()}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(exam.examDate).toLocaleString('en-BD', { month: 'short' })}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-200 truncate">{exam.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {exam.subject && (
                      <span className="text-xs text-zinc-500">{exam.subject.name}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${typeClass}`}>
                      {exam.examType.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-zinc-600">{exam.term}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium ${until.color}`}>{until.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{exam.totalMarks} marks</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
