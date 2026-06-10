'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Clock, AlertTriangle, DollarSign,
  Plus, CheckCircle, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DashStats {
  totalCollected: string; totalPending: string; totalOverdue: string;
  collectedThisMonth: string;
  monthlyData: { month: string; collected: number }[];
  recentPayments: {
    id: string; studentName: string; title: string;
    amount: string; paidAt: string; paymentMethod: string;
  }[];
}

interface Invoice {
  id: string; title: string; amount: string; status: string;
  dueDate: string; paidAt: string | null; paymentMethod: string | null;
  student: { firstName: string; lastName: string; class: { name: string; section: string | null } | null } | null;
}

type InvoiceMeta = { total: number; page: number; limit: number; totalPages: number };

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  partial:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  overdue:  'bg-red-500/10 text-red-400 border-red-500/20',
  waived:   'bg-zinc-700/50 text-zinc-400 border-zinc-700',
};

function fmt(v: string | number | undefined | null) {
  if (v == null) return '৳0';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return '৳0';
  return `৳${n.toLocaleString()}`;
}

export default function FinancePage() {
  const t = useTranslations('finance');
  const tc = useTranslations('common');

  const [stats, setStats] = useState<DashStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceMeta, setInvoiceMeta] = useState<InvoiceMeta | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [cashModal, setCashModal] = useState<Invoice | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashSaving, setCashSaving] = useState(false);

  useEffect(() => {
    api.get<{ success: boolean; data: DashStats }>('/finance/dashboard')
      .then((r) => setStats(r.data.data))
      .catch(() => toast.error(t('failedLoadStats')))
      .finally(() => setStatsLoading(false));
  }, [t]);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ success: boolean; data: Invoice[]; meta: InvoiceMeta }>(
        `/finance/invoices?${params}`,
      );
      setInvoices(res.data.data ?? []);
      setInvoiceMeta(res.data.meta);
    } catch { toast.error(t('failedLoadInvoices')); }
    finally { setInvoicesLoading(false); }
  }, [page, statusFilter, t]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  async function recordCash() {
    if (!cashModal || !cashAmount) return;
    setCashSaving(true);
    try {
      await api.put(`/finance/invoices/${cashModal.id}`, {
        paidAmount: parseFloat(cashAmount),
        paymentMethod: 'cash',
      });
      toast.success(t('paymentRecorded'));
      setCashModal(null);
      setCashAmount('');
      fetchInvoices();
    } catch { toast.error(t('failedRecordPayment')); }
    finally { setCashSaving(false); }
  }

  const maxMonthly = stats ? Math.max(...stats.monthlyData.map((m) => m.collected), 1) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <Link href="/dashboard/finance/fee-structures">
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white gap-2">
            <ExternalLink className="w-4 h-4" /> {t('feeStructures')}
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('collectedThisMonth'), value: stats?.collectedThisMonth, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: t('totalCollected'),     value: stats?.totalCollected,     icon: DollarSign,   color: 'text-blue-400',    bg: 'bg-blue-500/10' },
          { label: t('outstanding'),        value: stats?.totalPending,       icon: Clock,        color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
          { label: t('overdue'),            value: stats?.totalOverdue,       icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            {statsLoading
              ? <Skeleton className="h-7 w-24 bg-zinc-800" />
              : <p className="text-2xl font-bold text-white">{value ? fmt(value) : '৳0'}</p>}
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      {stats && stats.monthlyData.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">{t('monthlyCollections')}</h3>
          <div className="flex items-end gap-2 h-24">
            {stats.monthlyData.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-600/60 hover:bg-blue-600 transition-colors"
                  style={{ height: `${Math.max((m.collected / maxMonthly) * 80, 4)}px` }}
                  title={fmt(m.collected)}
                />
                <span className="text-xs text-zinc-600">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">{t('invoices')}</h3>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-8 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-xs text-white"
            >
              <option value="">{t('filterAll')}</option>
              <option value="pending">{t('filterPending')}</option>
              <option value="paid">{t('filterPaid')}</option>
              <option value="overdue">{t('filterOverdue')}</option>
              <option value="partial">{t('filterPartial')}</option>
            </select>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {[t('colStudent'), t('colInvoice'), t('colAmount'), t('colDueDate'), t('colStatus'), ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoicesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20 bg-zinc-800" /></td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 text-sm">
                    {t('noInvoices')}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : '—'}
                      {inv.student?.class && (
                        <span className="text-xs text-zinc-500 block">
                          {inv.student.class.name}{inv.student.class.section ? ` – ${inv.student.class.section}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{inv.title}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{fmt(inv.amount)}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLE[inv.status] ?? STATUS_STYLE.pending}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial') && (
                        <button
                          onClick={() => { setCashModal(inv); setCashAmount(inv.amount); }}
                          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> {t('recordCash')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {invoiceMeta && invoiceMeta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)} className="text-zinc-400">{tc('previous')}</Button>
            <span className="text-xs text-zinc-500">{tc('page')} {page} {tc('of')} {invoiceMeta.totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page >= invoiceMeta.totalPages}
              onClick={() => setPage((p) => p + 1)} className="text-zinc-400">{tc('next')}</Button>
          </div>
        )}
      </div>

      {/* Cash payment modal */}
      {cashModal && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setCashModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 z-50 space-y-4">
            <h3 className="text-lg font-semibold text-white">{t('recordCashTitle')}</h3>
            <p className="text-sm text-zinc-400">{cashModal.title}</p>
            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t('amountPaid')}</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={recordCash} disabled={cashSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {cashSaving ? t('recording') : t('confirmPayment')}
              </Button>
              <Button variant="ghost" onClick={() => setCashModal(null)} className="text-zinc-400">{tc('cancel')}</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
