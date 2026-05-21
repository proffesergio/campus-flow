'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportCard {
  student: { firstName: string; lastName: string; rollNumber: string | null };
  class: { name: string; section: string | null };
  term: string;
  classRank: number;
  classSize: number;
  totalMarksObtained: number;
  totalMarksPossible: number;
  overallPercent: number;
  overallGrade: string;
  exams: {
    id: string; subjectName: string; examName: string; examType: string;
    marksObtained: number | null; totalMarks: number;
    isAbsent: boolean; grade: string | null; rank: number | null;
  }[];
}

export default function ReportCardPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ReportCard | null>(null);
  const [terms, setTerms] = useState<string[]>([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ReportCard }>(
        `/grades/report-card?studentId=${id}&term=${encodeURIComponent(t)}`,
      );
      setData(res.data.data);
    } catch { toast.error('Failed to load report card'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    api.get<{ success: boolean; data: string[] }>(`/grades/student/${id}/terms`)
      .then((r) => {
        const t = r.data.data;
        setTerms(t);
        if (t.length > 0) { setTerm(t[0]); fetchReport(t[0]); }
      })
      .catch(() => {
        const defaultTerm = '2025-26 Term 1';
        setTerm(defaultTerm);
        fetchReport(defaultTerm);
      });
  }, [id, fetchReport]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await api.get(`/grades/report-card/${id}/pdf?term=${encodeURIComponent(term)}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-card-${id}-${term}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF generation failed'); }
    finally { setDownloading(false); }
  }

  async function generateAI() {
    setAiLoading(true);
    setAiText('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/ai/report-narrative`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-School-Slug': localStorage.getItem('campusflow_slug') ?? '',
          },
          credentials: 'include',
          body: JSON.stringify({ studentId: id, term }),
        },
      );
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
          if (payload === '[DONE]') return;
          try {
            const { text, error } = JSON.parse(payload) as { text?: string; error?: string };
            if (error) { setAiText(error); return; }
            if (text) setAiText((prev) => prev + text);
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch {
      setAiText('Could not connect to the AI service. Make sure ANTHROPIC_API_KEY is set in the backend .env file.');
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return (
    <div className="p-6 space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-48 bg-zinc-800" />
      <Skeleton className="h-64 bg-zinc-800 rounded-xl" />
    </div>
  );

  if (!data) return (
    <div className="p-6 text-center text-zinc-400">
      No report card data found.{' '}
      <Link href={`/dashboard/students/${id}`} className="text-blue-400 hover:underline">Go back</Link>
    </div>
  );

  const pct = data.overallPercent.toFixed(1);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/students/${id}`}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Report Card</h1>
          <p className="text-sm text-zinc-500">{data.student.firstName} {data.student.lastName}</p>
        </div>
        <select
          value={term}
          onChange={(e) => { setTerm(e.target.value); fetchReport(e.target.value); }}
          className="h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-sm text-white"
        >
          {terms.length > 0 ? terms.map((t) => (
            <option key={t} value={t}>{t}</option>
          )) : <option value={term}>{term}</option>}
        </select>
        <Button onClick={handleDownload} disabled={downloading} variant="outline"
          className="border-zinc-700 text-zinc-300 hover:text-white gap-2">
          <Download className="w-4 h-4" />
          {downloading ? 'Generating...' : 'PDF'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Overall', value: `${pct}%` },
          { label: 'Grade', value: data.overallGrade },
          { label: 'Class Rank', value: `${data.classRank}/${data.classSize}` },
          { label: 'Total Marks', value: `${data.totalMarksObtained}/${data.totalMarksPossible}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Grades table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Subject', 'Exam', 'Type', 'Marks', 'Grade', 'Rank'].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.exams.map((e) => (
              <tr key={e.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                <td className="px-4 py-3 text-sm font-medium text-zinc-200">{e.subjectName}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{e.examName}</td>
                <td className="px-4 py-3 text-xs text-zinc-500 capitalize">{e.examType.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">
                  {e.isAbsent ? <span className="text-red-400">Absent</span> : `${e.marksObtained ?? '—'}/${e.totalMarks}`}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-blue-400">{e.grade ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-zinc-500">{e.rank ? `#${e.rank}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Narrative */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> AI Narrative
          </h3>
          <Button onClick={generateAI} disabled={aiLoading} size="sm" variant="ghost"
            className="text-purple-400 hover:text-purple-300 gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiText ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
        {aiText ? (
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            rows={5}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-purple-500"
          />
        ) : (
          <p className="text-sm text-zinc-500 italic">
            {aiLoading ? 'Generating narrative...' : 'Click Generate to create an AI-written performance narrative for this report card.'}
          </p>
        )}
      </div>
    </div>
  );
}
