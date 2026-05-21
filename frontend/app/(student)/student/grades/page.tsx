'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter } from 'lucide-react';
import { api } from '@/lib/api';

interface Grade {
  id: string;
  marksObtained: number | null;
  isAbsent: boolean;
  grade: string | null;
  remarks: string | null;
  createdAt: string;
  exam: {
    id: string;
    name: string;
    examType: string;
    totalMarks: number;
    term: string;
    subject?: { name: string };
  };
}

function gradeBadgeClass(pct: number) {
  if (pct >= 80) return 'bg-green-500/20 text-green-400';
  if (pct >= 60) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [termFilter, setTermFilter] = useState('');
  const [terms, setTerms] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (termFilter) params.set('term', termFilter);
    api.get<{ success: boolean; data: Grade[] }>(`/grades/my-grades?${params}`)
      .then((r) => {
        const list = r.data.data ?? [];
        setGrades(list);
        const uniqueTerms = [...new Set(list.map((g) => g.exam.term))].sort().reverse();
        setTerms(uniqueTerms);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [termFilter]);

  const grouped = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    const term = g.exam.term;
    if (!acc[term]) acc[term] = [];
    acc[term].push(g);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            My Grades
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{grades.length} results</p>
        </div>
        {terms.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Terms</option>
              {terms.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No grades recorded yet</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([term, termGrades]) => (
            <div key={term}>
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                {term}
              </h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Exam</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Subject</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Marks</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {termGrades.map((g, i) => {
                        const pct =
                          !g.isAbsent && g.marksObtained !== null
                            ? Math.round((g.marksObtained / g.exam.totalMarks) * 100)
                            : null;
                        return (
                          <motion.tr
                            key={g.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                          >
                            <td className="px-4 py-3 text-zinc-200 font-medium">{g.exam.name}</td>
                            <td className="px-4 py-3 text-zinc-400">{g.exam.subject?.name ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded capitalize">
                                {g.exam.examType.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-300">
                              {g.isAbsent ? (
                                <span className="text-zinc-500">Absent</span>
                              ) : g.marksObtained !== null ? (
                                `${g.marksObtained} / ${g.exam.totalMarks}`
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {pct !== null ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${gradeBadgeClass(pct)}`}>
                                  {g.grade ?? `${pct}%`}
                                </span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  );
}
