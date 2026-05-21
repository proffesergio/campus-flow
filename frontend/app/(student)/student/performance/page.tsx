'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart3, Sparkles, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Grade {
  id: string;
  marksObtained: number | null;
  isAbsent: boolean;
  grade: string | null;
  exam: {
    name: string;
    totalMarks: number;
    term: string;
    subject?: { name: string };
  };
}

interface RankData {
  rank: number | null;
  total: number;
}

export default function PerformancePage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [rank, setRank] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api.get<{ success: boolean; data: Grade[] }>('/grades/my-grades'),
      api.get<{ success: boolean; data: RankData }>('/students/me/ranking'),
    ]).then(([gradesRes, rankRes]) => {
      if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data.data ?? []);
      if (rankRes.status === 'fulfilled') setRank(rankRes.value.data.data);
    }).finally(() => setLoading(false));
  }, []);

  async function generateSummary() {
    if (aiLoading) return;
    setAiText('');
    setAiDone(false);
    setAiLoading(true);

    abortRef.current = new AbortController();
    const slug = typeof window !== 'undefined' ? localStorage.getItem('campusflow_slug') ?? '' : '';

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/ai/report-narrative`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-School-Slug': slug,
          },
          body: JSON.stringify({ studentId: 'me', term: 'current' }),
          credentials: 'include',
          signal: abortRef.current.signal,
        },
      );

      if (!res.ok || !res.body) {
        setAiText('Could not generate summary. Make sure the Anthropic API key is configured.');
        setAiDone(true);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { setAiDone(true); return; }
          try {
            const { text, error } = JSON.parse(payload);
            if (error) { setAiText((p) => p + `\n\nError: ${error}`); setAiDone(true); return; }
            if (text) setAiText((p) => p + text);
          } catch { /* malformed chunk */ }
        }
      }
      setAiDone(true);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setAiText('Failed to connect to AI service.');
        setAiDone(true);
      }
    } finally {
      setAiLoading(false);
    }
  }

  // Subject-wise averages
  const subjectMap: Record<string, { total: number; obtained: number; count: number }> = {};
  for (const g of grades) {
    if (g.isAbsent || g.marksObtained === null) continue;
    const sub = g.exam.subject?.name ?? 'General';
    if (!subjectMap[sub]) subjectMap[sub] = { total: 0, obtained: 0, count: 0 };
    subjectMap[sub].total += g.exam.totalMarks;
    subjectMap[sub].obtained += g.marksObtained;
    subjectMap[sub].count += 1;
  }
  const subjects = Object.entries(subjectMap).map(([name, d]) => ({
    name,
    avg: Math.round((d.obtained / d.total) * 100),
    count: d.count,
  })).sort((a, b) => b.avg - a.avg);

  const overallAvg = subjects.length > 0
    ? Math.round(subjects.reduce((s, sub) => s + sub.avg, 0) / subjects.length)
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        My Performance
      </h1>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-zinc-800 rounded-xl" />
          <div className="h-40 bg-zinc-800 rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{overallAvg !== null ? `${overallAvg}%` : '—'}</p>
              <p className="text-xs text-zinc-500 mt-1">Overall Average</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <p className="text-2xl font-bold text-white">{rank?.rank ?? '—'}</p>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Class Rank {rank?.total ? `/ ${rank.total}` : ''}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{grades.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Exams Taken</p>
            </div>
          </div>

          {/* Subject breakdown */}
          {subjects.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4 text-sm">Subject Averages</h2>
              <div className="space-y-3">
                {subjects.map((sub) => (
                  <div key={sub.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-300">{sub.name}</span>
                      <span className={`text-sm font-bold ${
                        sub.avg >= 80 ? 'text-green-400' : sub.avg >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {sub.avg}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.avg}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          sub.avg >= 80 ? 'bg-green-500' : sub.avg >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Performance Summary
              </h2>
              {(aiText || aiDone) && (
                <button
                  onClick={() => { setAiText(''); setAiDone(false); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {!aiText && !aiLoading && (
              <button
                onClick={generateSummary}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-medium py-3 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Performance Summary
              </button>
            )}

            {(aiText || aiLoading) && (
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {aiText}
                  {!aiDone && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle"
                    />
                  )}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
