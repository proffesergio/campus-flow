'use client';

import { motion } from 'framer-motion';
import { Users, ClipboardCheck, DollarSign, BookOpen } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { stagger } from '@/lib/design/tokens';
import { formatCompact, formatTaka, trendDirection } from '@/lib/dashboard/helpers';

export interface KpiData {
  students: { total: number; thisMonth: number } | null;
  attendancePercent: number | null;
  attendancePrev: number | null;
  feesCollected: string | number | null;
  feesThisMonth: string | number | null;
  upcomingExams: number;
  nextExamLabel?: string;
}

export default function KpiRow({ data }: { data: KpiData }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Students" icon={Users} accent="blue"
        value={data.students ? formatCompact(data.students.total) : '—'}
        trend={data.students ? { direction: data.students.thisMonth > 0 ? 'up' : 'flat', text: `+${data.students.thisMonth} this month` } : undefined} />
      <StatCard label="Attendance" icon={ClipboardCheck} accent="emerald"
        value={data.attendancePercent != null ? `${data.attendancePercent}%` : '—'}
        trend={data.attendancePercent != null ? { direction: trendDirection(data.attendancePercent, data.attendancePrev), text: 'vs last month' } : undefined} />
      <StatCard label="Fees collected" icon={DollarSign} accent="purple"
        value={data.feesCollected != null ? formatTaka(data.feesCollected) : '—'}
        hint={data.feesThisMonth != null ? `${formatTaka(data.feesThisMonth)} this month` : undefined} />
      <StatCard label="Upcoming exams" icon={BookOpen} accent="amber"
        value={data.upcomingExams} hint={data.nextExamLabel} />
    </motion.div>
  );
}
