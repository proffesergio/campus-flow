'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, AlertTriangle, BookOpen, Users, ChevronRight,
  CheckCircle2, GraduationCap, Clock, ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TodayClass {
  id: string;
  name: string;
  section: string | null;
  _count: { students: number };
  markedCount: number;
  isMarked: boolean;
}

interface RecentExam {
  id: string;
  name: string;
  examDate: string;
  examType: string;
  subject: { name: string } | null;
  class: { name: string; section: string | null } | null;
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const TYPE_COLORS: Record<string, string> = {
  midterm: 'bg-blue-500/10 text-blue-400',
  final: 'bg-red-500/10 text-red-400',
  quiz: 'bg-green-500/10 text-green-400',
  assignment: 'bg-yellow-500/10 text-yellow-400',
  class_test: 'bg-purple-500/10 text-purple-400',
};

export default function TeacherHomePage() {
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [exams, setExams] = useState<RecentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const h = new Date().getHours();
      setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.allSettled([
      api.get<{ success: boolean; data: TodayClass[] }>('/attendance/today-status'),
      api.get<{ success: boolean; data: RecentExam[] }>('/exams?limit=6'),
    ]).then(([c, e]) => {
      if (c.status === 'fulfilled') setClasses(c.value.data.data ?? []);
      if (e.status === 'fulfilled') setExams((e.value.data.data ?? []).slice(0, 6));
      setLoading(false);
    });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const unmarked = classes.filter((c) => !c.isMarked);
  const totalStudents = classes.reduce((sum, c) => sum + c._count.students, 0);
  const markedClasses = classes.length - unmarked.length;

  const statCards = [
    { label: 'Classes Today', value: classes.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Students', value: totalStudents, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Attendance Pending', value: unmarked.length, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Attendance Done', value: markedClasses, icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'linear-gradient(180deg, #09090b 0%, #0a0a0f 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-500 font-medium">{time} · {today}</span>
        </div>
        <h1 className="text-3xl font-bold text-white">{greeting} 👋</h1>
        <p className="text-zinc-400 text-sm mt-1">Here&apos;s your teaching day at a glance.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={fadeUp} className={`relative bg-zinc-900 border ${card.border} rounded-xl p-4`}>
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} mb-3`}>
                <Icon className={`${card.color}`} style={{ width: 18, height: 18 }} />
              </div>
              <p className="text-xs text-zinc-500 mb-1 font-medium">{card.label}</p>
              {loading ? (
                <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-white leading-tight">{card.value}</p>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's classes */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Today&apos;s Classes</h3>
            </div>
            <Link href="/dashboard/attendance" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
              Mark attendance <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-zinc-800/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No classes configured yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {classes.map((c, i) => {
                const pct = c._count.students > 0 ? Math.round((c.markedCount / c._count.students) * 100) : 0;
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {c.name}{c.section ? ` – ${c.section}` : ''}
                      </p>
                      <p className="text-xs text-zinc-500">{c._count.students} students</p>
                    </div>
                    {c.isMarked ? (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> {pct}% marked
                      </span>
                    ) : (
                      <Link href="/dashboard/attendance"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-[11px] font-medium flex-shrink-0 transition-colors">
                        <ClipboardCheck className="w-3 h-3" /> Mark now
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Attendance alerts */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.35 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Attendance Alerts</h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-zinc-800/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : unmarked.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">All classes marked today 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unmarked.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href="/dashboard/attendance"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/[0.06] border border-yellow-500/15 hover:border-yellow-500/30 transition-colors group">
                    <div className="w-7 h-7 rounded-md bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">
                        {c.name}{c.section ? ` – ${c.section}` : ''}
                      </p>
                      <p className="text-[11px] text-yellow-500/70">Not marked yet</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent grade submissions */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Recent Grade Submissions</h3>
          </div>
          <Link href="/dashboard/exams" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-zinc-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="py-8 text-center">
            <GraduationCap className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">No exams yet</p>
            <Link href="/dashboard/exams/new" className="text-xs text-blue-400 hover:underline mt-1 block">
              Create an exam
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((exam, i) => (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dashboard/exams/${exam.id}/marks`}
                  className="block p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors group h-full">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">{exam.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize flex-shrink-0 ${TYPE_COLORS[exam.examType] ?? 'bg-zinc-700/50 text-zinc-400'}`}>
                      {exam.examType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {exam.subject?.name ?? '—'}
                    {exam.class ? ` · ${exam.class.name}${exam.class.section ? ` – ${exam.class.section}` : ''}` : ''}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-1.5">
                    {new Date(exam.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
