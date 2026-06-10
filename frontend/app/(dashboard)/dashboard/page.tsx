'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { fadeUp, stagger } from '@/lib/design/tokens';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import KpiRow, { KpiData } from '@/components/dashboard/KpiRow';
import TrendCharts, { AttendancePoint, FeePoint, GradeBucket } from '@/components/dashboard/TrendCharts';
import AtRiskPanel, { AtRiskItem } from '@/components/dashboard/AtRiskPanel';
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed';
import { OnboardingCounts } from '@/lib/dashboard/helpers';

interface Summary {
  onboarding: OnboardingCounts;
  gradeDistribution: GradeBucket[];
  attendanceTrend: AttendancePoint[];
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [greeting, setGreeting] = useState('');
  const [counts, setCounts] = useState<OnboardingCounts>({ classes: 0, subjects: 0, students: 0, exams: 0 });
  const [grades, setGrades] = useState<GradeBucket[]>([]);
  const [attendance, setAttendance] = useState<AttendancePoint[]>([]);
  const [fees, setFees] = useState<FeePoint[]>([]);
  const [kpi, setKpi] = useState<KpiData>({
    students: null, attendancePercent: null, attendancePrev: null,
    feesCollected: null, feesThisMonth: null, upcomingExams: 0,
  });
  const [atRisk, setAtRisk] = useState<AtRiskItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? t('greetingMorning') : h < 17 ? t('greetingAfternoon') : t('greetingEvening'));
  }, [t]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/analytics/dashboard-summary'),
      api.get('/students/stats'),
      api.get('/finance/dashboard'),
      api.get('/exams?limit=5&upcoming=true'),
      api.get('/analytics/at-risk'),
      api.get('/audit?limit=6'),
    ]).then(([summary, students, finance, exams, risk, audit]) => {
      if (summary.status === 'fulfilled') {
        const s = summary.value.data.data as Summary;
        setCounts(s.onboarding);
        setGrades(s.gradeDistribution);
        setAttendance(s.attendanceTrend);
        const last = s.attendanceTrend[s.attendanceTrend.length - 1]?.percent ?? null;
        const prev = s.attendanceTrend[s.attendanceTrend.length - 2]?.percent ?? null;
        setKpi((k) => ({ ...k, attendancePercent: last, attendancePrev: prev }));
      }
      if (students.status === 'fulfilled') {
        const st = students.value.data.data;
        setKpi((k) => ({ ...k, students: { total: st.active ?? st.total, thisMonth: st.thisMonth } }));
      }
      if (finance.status === 'fulfilled') {
        const f = finance.value.data.data;
        setFees((f.monthlyData ?? []).map((m: { month: string; amount: number }) => ({ month: m.month, collected: m.amount })));
        setKpi((k) => ({ ...k, feesCollected: f.totalCollected, feesThisMonth: f.collectedThisMonth }));
      }
      if (exams.status === 'fulfilled') {
        const list = exams.value.data.items ?? exams.value.data.data ?? [];
        const next = list[0];
        setKpi((k) => ({ ...k, upcomingExams: list.length, nextExamLabel: next ? `next: ${next.subject?.name ?? next.name}` : undefined }));
      }
      if (risk.status === 'fulfilled') setAtRisk(risk.value.data.items ?? []);
      if (audit.status === 'fulfilled') {
        const rows = audit.value.data.items ?? audit.value.data.data ?? [];
        setActivity(rows.map((r: { id: string; action: string; entity: string; createdAt: string; actorEmail?: string }) => ({
          id: r.id, action: r.action, entity: r.entity, createdAt: r.createdAt,
          actorName: r.actorEmail ? r.actorEmail.split('@')[0] : undefined,
        })));
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-white">{greeting} 👋</h1>
        <p className="text-sm text-zinc-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </motion.div>

      <OnboardingChecklist counts={counts} />
      <KpiRow data={kpi} />
      <TrendCharts attendance={attendance} fees={fees} grades={grades} />

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AtRiskPanel items={atRisk} />
        <ActivityFeed items={activity} />
      </motion.div>
    </div>
  );
}
