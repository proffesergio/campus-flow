'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  Trophy,
  DollarSign,
  CalendarDays,
  TrendingUp,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardData {
  student: {
    firstName: string;
    lastName: string;
    class?: { name: string; section?: string };
  };
  attendancePct: number | null;
  pendingFeesAmount: number;
  pendingFeesCount: number;
  upcomingExams: { id: string; name: string; examDate: string; subject?: { name: string } }[];
  recentGrades: {
    id: string;
    marksObtained: number | null;
    isAbsent: boolean;
    exam: {
      name: string;
      totalMarks: number;
      subject?: { name: string };
    };
  }[];
  classRank: number;
  classSize: number;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const card = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: DashboardData }>('/students/me/dashboard')
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-zinc-800 rounded-lg w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const student = data?.student;
  const attPct = data?.attendancePct;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {student?.firstName ?? 'Student'} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {student?.class?.name}{student?.class?.section ? ` ${student.class.section}` : ''} &middot;{' '}
          {new Date().toLocaleDateString('en-BD', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={card} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-4 h-4 text-green-400" />
            <span className="text-xs text-zinc-400">Attendance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {attPct !== null ? `${attPct}%` : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Overall rate</p>
          {attPct != null && attPct < 75 && (
            <div className="flex items-center gap-1 mt-2 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs">Below threshold</span>
            </div>
          )}
        </motion.div>

        <motion.div variants={card} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-zinc-400">Class Rank</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {data?.classRank ?? '—'}
            {data?.classSize && (
              <span className="text-sm text-zinc-500 ml-1">/ {data.classSize}</span>
            )}
          </p>
          <p className="text-xs text-zinc-500 mt-1">By average grade</p>
        </motion.div>

        <motion.div variants={card} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-xs text-zinc-400">Pending Fees</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ৳{(data?.pendingFeesAmount ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {data?.pendingFeesCount ?? 0} invoice{(data?.pendingFeesCount ?? 0) !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div variants={card} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-400">Upcoming Exams</span>
          </div>
          <p className="text-2xl font-bold text-white">{data?.upcomingExams?.length ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-1">Scheduled ahead</p>
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              Upcoming Exams
            </h2>
            <Link href="/student/exams" className="text-xs text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          {!data?.upcomingExams?.length ? (
            <p className="text-sm text-zinc-500 text-center py-6">No upcoming exams</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingExams.slice(0, 4).map((exam) => (
                <div key={exam.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">
                      {new Date(exam.examDate).getDate()}
                    </span>
                    <span className="text-[10px] text-blue-500">
                      {new Date(exam.examDate).toLocaleString('en-BD', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{exam.name}</p>
                    {exam.subject && (
                      <p className="text-xs text-zinc-500">{exam.subject.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Grades */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Recent Grades
            </h2>
            <Link href="/student/grades" className="text-xs text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          {!data?.recentGrades?.length ? (
            <p className="text-sm text-zinc-500 text-center py-6">No grades yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentGrades.slice(0, 4).map((g) => {
                const pct = g.isAbsent
                  ? null
                  : g.marksObtained !== null
                  ? Math.round((g.marksObtained / g.exam.totalMarks) * 100)
                  : null;
                return (
                  <div key={g.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{g.exam.name}</p>
                      {g.exam.subject && (
                        <p className="text-xs text-zinc-500">{g.exam.subject.name}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {g.isAbsent ? (
                        <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">Absent</span>
                      ) : pct !== null ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            pct >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : pct >= 60
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/student/ai-assistant', label: 'Ask AI Tutor', icon: '🤖', color: 'indigo' },
            { href: '/student/practice/generate', label: 'Practice Test', icon: '📝', color: 'blue' },
            { href: '/student/performance', label: 'My Performance', icon: '📊', color: 'purple' },
            { href: '/student/fees', label: 'View Fees', icon: '💰', color: 'amber' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors text-center"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-medium text-zinc-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
