'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  CalendarCheck,
  Trophy,
  Wallet,
  ClipboardList,
  BookOpen,
  Receipt,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent, formatDate, type AppLocale } from '@/lib/format';

type Tab = 'attendance' | 'grades' | 'fees';

interface Dashboard {
  student: {
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    class: { name: string; section: string | null; academicYear: string } | null;
  };
  attendancePct: number | null;
  pendingFeesAmount: number;
  pendingFeesCount: number;
  classRank: number | null;
  classSize: number;
}

const STATUS_COLOR: Record<string, string> = {
  present: 'text-emerald-400',
  absent: 'text-red-400',
  late: 'text-amber-400',
  excused: 'text-blue-400',
};

export default function ChildDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const locale = useLocale() as AppLocale;
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>('attendance');
  const [tabData, setTabData] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ success: boolean; data: Dashboard }>(`/parents/me/children/${studentId}/dashboard`)
      .then((r) => setDash(r.data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [studentId]);

  const loadTab = useCallback(
    async (t: Tab) => {
      if (tabData[t]) return;
      setTabLoading(true);
      try {
        if (t === 'attendance') {
          const r = await api.get<{ items: unknown[] }>(`/parents/me/children/${studentId}/attendance`);
          setTabData((d) => ({ ...d, attendance: r.data.items ?? [] }));
        } else if (t === 'grades') {
          const r = await api.get<{ data: { grades: unknown[] } }>(
            `/parents/me/children/${studentId}/grades`,
          );
          setTabData((d) => ({ ...d, grades: r.data.data.grades ?? [] }));
        } else {
          const r = await api.get<{ items: unknown[] }>(`/parents/me/children/${studentId}/invoices`);
          setTabData((d) => ({ ...d, fees: r.data.items ?? [] }));
        }
      } catch {
        setTabData((d) => ({ ...d, [t]: [] }));
      } finally {
        setTabLoading(false);
      }
    },
    [studentId, tabData],
  );

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="h-32 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!dash) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-zinc-400">
        <p>This child could not be found for your account.</p>
        <Link href="/parent" className="text-emerald-400 text-sm mt-2 inline-block">
          ← Back to my children
        </Link>
      </div>
    );
  }

  const s = dash.student;
  const cls = s.class ? `${s.class.name}${s.class.section ? ` ${s.class.section}` : ''}` : '—';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <Link href="/parent" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="w-4 h-4" /> My Children
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">
          {s.firstName} {s.lastName}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {cls}
          {s.rollNumber ? ` · Roll ${s.rollNumber}` : ''}
          {s.class ? ` · ${s.class.academicYear}` : ''}
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={CalendarCheck} label="Attendance" color="text-emerald-400"
          value={dash.attendancePct != null ? formatPercent(dash.attendancePct, locale) : '—'} />
        <StatCard icon={Trophy} label="Class Rank" color="text-amber-400"
          value={dash.classRank != null ? `${formatNumber(dash.classRank, locale)} / ${formatNumber(dash.classSize, locale)}` : '—'} />
        <StatCard icon={Wallet} label="Pending Fees" color="text-red-400"
          value={formatCurrency(dash.pendingFeesAmount, locale)}
          sub={dash.pendingFeesCount > 0 ? `${formatNumber(dash.pendingFeesCount, locale)} invoice(s)` : 'All clear'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {([
          ['attendance', 'Attendance', ClipboardList],
          ['grades', 'Results', BookOpen],
          ['fees', 'Fees', Receipt],
        ] as [Tab, string, typeof ClipboardList][]).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-emerald-500 text-emerald-400 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tabLoading && <div className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />}

      {!tabLoading && tab === 'attendance' && (
        <Section empty={(tabData.attendance ?? []).length === 0} emptyText="No attendance records yet.">
          {(tabData.attendance as AttRec[] | undefined)?.map((a, i) => (
            <Row key={i}
              left={formatDate(a.date, locale)}
              right={<span className={`capitalize font-medium ${STATUS_COLOR[a.status] ?? 'text-zinc-300'}`}>{a.status}</span>}
              sub={a.note ?? undefined}
            />
          ))}
        </Section>
      )}

      {!tabLoading && tab === 'grades' && (
        <Section empty={(tabData.grades ?? []).length === 0} emptyText="No published results yet.">
          {(tabData.grades as GradeRec[] | undefined)?.map((g, i) => (
            <Row key={i}
              left={`${g.exam.subject.name} — ${g.exam.name}`}
              right={
                g.isAbsent
                  ? <span className="text-red-400 font-medium">Absent</span>
                  : <span className="text-white font-medium">{g.marksObtained != null ? formatNumber(g.marksObtained, locale) : '—'} / {formatNumber(g.exam.totalMarks, locale)}{g.grade ? ` (${g.grade})` : ''}</span>
              }
            />
          ))}
        </Section>
      )}

      {!tabLoading && tab === 'fees' && (
        <Section empty={(tabData.fees ?? []).length === 0} emptyText="No invoices.">
          {(tabData.fees as InvoiceRec[] | undefined)?.map((inv, i) => (
            <Row key={i}
              left={inv.title}
              sub={`Due ${formatDate(inv.dueDate, locale)}`}
              right={
                <span className="text-right">
                  <span className="block text-white font-medium">{formatCurrency(Number(inv.amount), locale)}</span>
                  <span className={`text-xs capitalize ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                    {inv.status}
                  </span>
                </span>
              }
            />
          ))}
        </Section>
      )}
    </div>
  );
}

interface AttRec { date: string; status: string; note: string | null }
interface GradeRec { marksObtained: number | null; isAbsent: boolean; grade: string | null; exam: { name: string; totalMarks: number; subject: { name: string } } }
interface InvoiceRec { title: string; amount: number | string; dueDate: string; status: string }

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof CalendarCheck; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
        <Icon className={`w-4 h-4 ${color}`} /> {label}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ children, empty, emptyText }: { children: React.ReactNode; empty: boolean; emptyText: string }) {
  if (empty) return <p className="text-sm text-zinc-500 py-8 text-center">{emptyText}</p>;
  return <div className="rounded-xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800">{children}</div>;
}

function Row({ left, right, sub }: { left: string; right: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-zinc-200 truncate">{left}</p>
        {sub && <p className="text-xs text-zinc-500 truncate">{sub}</p>}
      </div>
      <div className="flex-shrink-0 text-sm">{right}</div>
    </div>
  );
}
