'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard');
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label={t('kpiStudents')} icon={Users} accent="blue"
        value={data.students ? formatCompact(data.students.total) : '—'}
        trend={data.students ? { direction: data.students.thisMonth > 0 ? 'up' : 'flat', text: `+${data.students.thisMonth} ${t('trendThisMonth')}` } : undefined} />
      <StatCard label={t('kpiAttendance')} icon={ClipboardCheck} accent="emerald"
        value={data.attendancePercent != null ? `${data.attendancePercent}%` : '—'}
        trend={data.attendancePercent != null ? { direction: trendDirection(data.attendancePercent, data.attendancePrev), text: t('trendVsLastMonth') } : undefined} />
      <StatCard label={t('kpiFeesCollected')} icon={DollarSign} accent="purple"
        value={data.feesCollected != null ? formatTaka(data.feesCollected) : '—'}
        hint={data.feesThisMonth != null ? `${formatTaka(data.feesThisMonth)} ${t('trendThisMonth')}` : undefined} />
      <StatCard label={t('kpiUpcomingExams')} icon={BookOpen} accent="amber"
        value={data.upcomingExams} hint={data.nextExamLabel} />
    </motion.div>
  );
}
