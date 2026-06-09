'use client';

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTranslations } from 'next-intl';
import { SectionCard } from '@/components/ui/section-card';
import { ACCENTS } from '@/lib/design/tokens';

export interface AttendancePoint { month: string; percent: number }
export interface FeePoint { month: string; collected: number }
export interface GradeBucket { label: string; count: number; color: string }

const axis = { stroke: '#52525b', fontSize: 11 };
const tooltip = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7' };

export default function TrendCharts({
  attendance, fees, grades,
}: { attendance: AttendancePoint[]; fees: FeePoint[]; grades: GradeBucket[] }) {
  const t = useTranslations('dashboard');
  const hasGrades = grades.some((g) => g.count > 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <SectionCard title={t('attendanceTrendTitle')} className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={attendance}>
            <defs>
              <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENTS.blue.hex} stopOpacity={0.5} />
                <stop offset="100%" stopColor={ACCENTS.blue.hex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
            <YAxis {...axis} tickLine={false} axisLine={false} domain={[0, 100]} width={28} />
            <Tooltip contentStyle={tooltip} />
            <Area type="monotone" dataKey="percent" stroke={ACCENTS.blue.hex} strokeWidth={2} fill="url(#att)" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title={t('gradeDistributionTitle')}>
        {hasGrades ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={grades} dataKey="count" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {grades.map((g) => <Cell key={g.label} fill={g.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-zinc-600 text-center py-12">{t('noGradesPublished')}</p>
        )}
      </SectionCard>

      <SectionCard title={t('feeCollectionTitle')} className="lg:col-span-3">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={fees}>
            <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
            <YAxis {...axis} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={tooltip} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
            <Bar dataKey="collected" fill={ACCENTS.purple.hex} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
