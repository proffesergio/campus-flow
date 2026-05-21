'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ClipboardCheck, DollarSign, AlertTriangle,
  GraduationCap, BookOpen, TrendingUp, TrendingDown,
  ArrowUpRight, ChevronRight, Clock, Zap, Bell,
  UserPlus, CheckCircle2, XCircle, Activity,
} from 'lucide-react';
import { api } from '@/lib/api';

interface StudentStats { total: number; active: number; thisMonth: number }
interface FinanceDash {
  totalCollected: string; totalPending: string; totalOverdue: string;
  collectedThisMonth: string;
  monthlyData: { month: string; collected: number }[];
  recentPayments: { id: string; studentName: string; title: string; amount: string; paidAt: string; paymentMethod: string }[];
}
interface UpcomingExam {
  id: string; name: string; examDate: string; examType: string;
  subject: { name: string } | null;
  class: { name: string; section: string | null } | null;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function fmt(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '৳0';
  return `৳${n.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 4) : 4;
  return (
    <motion.div
      className={`w-full rounded-sm ${color}`}
      initial={{ height: 4 }}
      animate={{ height: `${pct}%` }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    />
  );
}

export default function DashboardPage() {
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [finance, setFinance] = useState<FinanceDash | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
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
      api.get<{ success: boolean; data: StudentStats }>('/students/stats'),
      api.get<{ success: boolean; data: FinanceDash }>('/finance/dashboard'),
      api.get<{ success: boolean; data: UpcomingExam[] }>('/exams?limit=5&upcoming=true'),
    ]).then(([s, f, e]) => {
      if (s.status === 'fulfilled') setStudentStats(s.value.data.data);
      if (f.status === 'fulfilled') setFinance(f.value.data.data);
      if (e.status === 'fulfilled') setUpcomingExams((e.value.data.data ?? []).slice(0, 5));
      setLoading(false);
    });
  }, []);

  const maxMonthly = finance
    ? Math.max(...(finance.monthlyData ?? []).map((m) => m.collected), 1)
    : 1;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const statCards = [
    {
      label: 'Total Students',
      value: loading ? null : studentStats?.total ?? 0,
      sub: `${studentStats?.active ?? 0} active`,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/dashboard/students',
      trend: studentStats?.thisMonth ? `+${studentStats.thisMonth} this month` : null,
      trendUp: true,
    },
    {
      label: 'Collected This Month',
      value: loading ? null : finance ? fmt(finance.collectedThisMonth) : '৳0',
      sub: 'Total: ' + (finance ? fmt(finance.totalCollected) : '৳0'),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      href: '/dashboard/finance',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Outstanding Fees',
      value: loading ? null : finance ? fmt(finance.totalPending) : '৳0',
      sub: null,
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      href: '/dashboard/finance',
      trend: null,
      trendUp: false,
    },
    {
      label: 'Overdue',
      value: loading ? null : finance ? fmt(finance.totalOverdue) : '৳0',
      sub: 'Needs attention',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      href: '/dashboard/finance',
      trend: null,
      trendUp: false,
    },
    {
      label: 'Upcoming Exams',
      value: loading ? null : upcomingExams.length,
      sub: upcomingExams[0]?.examDate
        ? 'Next: ' + new Date(upcomingExams[0].examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No upcoming exams',
      icon: GraduationCap,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      href: '/dashboard/exams',
      trend: null,
      trendUp: true,
    },
    {
      label: 'New Enrollments',
      value: loading ? null : studentStats?.thisMonth ?? 0,
      sub: 'This month',
      icon: UserPlus,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      href: '/dashboard/students',
      trend: null,
      trendUp: true,
    },
  ];

  const quickActions = [
    { label: 'Add Student', href: '/dashboard/students', icon: UserPlus, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Mark Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'New Exam', href: '/dashboard/exams/new', icon: BookOpen, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Fee Structures', href: '/dashboard/finance/fee-structures', icon: DollarSign, color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Broadcast', href: '/dashboard/notifications', icon: Bell, color: 'bg-pink-600 hover:bg-pink-700' },
    { label: 'Reports', href: '/dashboard/attendance/reports', icon: Activity, color: 'bg-indigo-600 hover:bg-indigo-700' },
  ];

  const TYPE_COLORS: Record<string, string> = {
    midterm: 'bg-blue-500/10 text-blue-400',
    final: 'bg-red-500/10 text-red-400',
    quiz: 'bg-green-500/10 text-green-400',
    assignment: 'bg-yellow-500/10 text-yellow-400',
    class_test: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: 'linear-gradient(180deg, #09090b 0%, #0a0a0f 100%)' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-500 font-medium">{time} · {today}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{greeting} 👋</h1>
          <p className="text-zinc-400 text-sm mt-1">Here&apos;s what&apos;s happening at your school today.</p>
        </div>
        <Link href="/dashboard/notifications">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} variants={fadeUp}>
              <Link href={card.href} className="block group">
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className={`relative bg-zinc-900 border ${card.border} rounded-xl p-4 overflow-hidden h-full`}
                >
                  {/* Subtle gradient glow */}
                  <div className={`absolute inset-0 ${card.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} mb-3`}>
                      <Icon className={`w-4.5 h-4.5 ${card.color}`} style={{ width: 18, height: 18 }} />
                    </div>
                    <p className="text-xs text-zinc-500 mb-1 font-medium">{card.label}</p>
                    {loading ? (
                      <div className="h-7 w-16 bg-zinc-800 rounded animate-pulse" />
                    ) : (
                      <p className="text-xl font-bold text-white leading-tight">{card.value}</p>
                    )}
                    {card.sub && !loading && (
                      <p className="text-xs text-zinc-600 mt-1 truncate">{card.sub}</p>
                    )}
                    {card.trend && (
                      <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${card.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {card.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {card.trend}
                      </div>
                    )}
                  </div>

                  <ArrowUpRight className="absolute top-3 right-3 w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly fee chart — takes 2 columns */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Fee Collection Trend</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Monthly collections (BDT)</p>
            </div>
            <Link href="/dashboard/finance"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-end gap-2 h-28">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 bg-zinc-800 rounded-t animate-pulse" style={{ height: `${30 + i * 8}%` }} />
              ))}
            </div>
          ) : finance && (finance.monthlyData ?? []).length > 0 ? (
            <div className="flex items-end gap-2 h-28">
              {(finance.monthlyData ?? []).map((m, i) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex items-end" style={{ height: 96 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((m.collected / maxMonthly) * 100, 4)}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                      className="w-full rounded-t bg-blue-600/60 hover:bg-blue-500 transition-colors cursor-default"
                      title={fmt(m.collected)}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600 font-medium">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-zinc-600 text-sm">
              No data yet
            </div>
          )}

          {/* Summary row */}
          {finance && (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-800">
              {[
                { label: 'This Month', val: fmt(finance.collectedThisMonth), color: 'text-emerald-400' },
                { label: 'Pending', val: fmt(finance.totalPending), color: 'text-yellow-400' },
                { label: 'Overdue', val: fmt(finance.totalOverdue), color: 'text-red-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-zinc-500">{label}</p>
                  <p className={`text-sm font-bold ${color} mt-0.5`}>{val}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.div key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link href={action.href}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white text-xs font-medium transition-colors ${action.color}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{action.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent payments */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.45 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Payments</h3>
            <Link href="/dashboard/finance"
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2.5 w-20 bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : !finance || (finance.recentPayments ?? []).length === 0 ? (
            <div className="py-8 text-center">
              <DollarSign className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No payments yet</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {(finance.recentPayments ?? []).slice(0, 5).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{p.studentName}</p>
                      <p className="text-xs text-zinc-600 truncate">{p.title} · {timeAgo(p.paidAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-400">{fmt(p.amount)}</p>
                      <p className="text-xs text-zinc-600 capitalize">{p.paymentMethod}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Upcoming exams */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Exams</h3>
            <Link href="/dashboard/exams"
              className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-36 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2.5 w-24 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="py-8 text-center">
              <GraduationCap className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No upcoming exams</p>
              <Link href="/dashboard/exams/new" className="text-xs text-blue-400 hover:underline mt-1 block">
                Schedule an exam
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam, i) => {
                const d = new Date(exam.examDate);
                const dayDiff = Math.ceil((d.getTime() - Date.now()) / 86400000);
                const isUrgent = dayDiff <= 2;
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border ${
                      isUrgent ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800 border-zinc-700'
                    }`}>
                      <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-400' : 'text-zinc-400'}`}>
                        {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className={`text-sm font-bold leading-none ${isUrgent ? 'text-red-300' : 'text-white'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{exam.name}</p>
                      <p className="text-xs text-zinc-600 truncate">
                        {exam.subject?.name ?? '—'} · {exam.class ? `${exam.class.name}${exam.class.section ? ` – ${exam.class.section}` : ''}` : '—'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${TYPE_COLORS[exam.examType] ?? 'bg-zinc-700/50 text-zinc-400'}`}>
                        {exam.examType.replace('_', ' ')}
                      </span>
                      {isUrgent && (
                        <p className="text-[10px] text-red-400 text-right mt-0.5">{dayDiff <= 0 ? 'Today!' : `${dayDiff}d`}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Module shortcut strip */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.55 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Students', count: studentStats?.total, icon: Users, href: '/dashboard/students', color: 'from-blue-600/20 to-blue-800/10 border-blue-500/20 hover:border-blue-400/40' },
          { label: 'Attendance', count: null, icon: ClipboardCheck, href: '/dashboard/attendance', color: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 hover:border-emerald-400/40' },
          { label: 'Exams', count: upcomingExams.length, icon: GraduationCap, href: '/dashboard/exams', color: 'from-purple-600/20 to-purple-800/10 border-purple-500/20 hover:border-purple-400/40' },
          { label: 'Finance', count: null, icon: DollarSign, href: '/dashboard/finance', color: 'from-orange-600/20 to-orange-800/10 border-orange-500/20 hover:border-orange-400/40' },
        ].map(({ label, count, icon: Icon, href, color }) => (
          <motion.div key={label} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link href={href}
              className={`flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br ${color} transition-all`}>
              <Icon className="w-5 h-5 text-white/60" />
              <div>
                <p className="text-xs text-white/60 font-medium">{label}</p>
                {count != null && !loading && (
                  <p className="text-lg font-bold text-white leading-none mt-0.5">{count}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
