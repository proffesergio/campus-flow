'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  title: string;
  amount: string | number;
  currency: string;
  dueDate: string;
  paidAt: string | null;
  paidAmount: string | number;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
}

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  overdue: { label: 'Overdue', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  partial: { label: 'Partial', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  waived: { label: 'Waived', icon: CheckCircle, color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' },
};

function fmt(v: string | number | undefined | null) {
  if (v == null) return '৳0';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '৳0' : `৳${n.toLocaleString()}`;
}

export default function StudentFeesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ success: boolean; data: { items: Invoice[] } }>('/finance/invoices/my')
      .then((r) => setInvoices(r.data.data?.items ?? []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const pending = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue' || i.status === 'partial');
  const pendingTotal = pending.reduce((s, i) => s + (parseFloat(String(i.amount)) - parseFloat(String(i.paidAmount ?? 0))), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-amber-400" />
        My Fees
      </h1>

      {/* Summary */}
      {pending.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-red-300 font-medium">Outstanding Balance</p>
            <p className="text-2xl font-bold text-white mt-1">{fmt(pendingTotal)}</p>
            <p className="text-xs text-zinc-400 mt-1">{pending.length} invoice{pending.length !== 1 ? 's' : ''} due</p>
          </div>
          <AlertTriangle className="w-10 h-10 text-red-500/50" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
            .map((inv, i) => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl p-4 ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{inv.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {inv.status === 'partial' && (
                        <p className="text-xs text-blue-400 mt-0.5">
                          Paid: {fmt(inv.paidAmount)} of {fmt(inv.amount)}
                        </p>
                      )}
                      {inv.paidAt && inv.status === 'paid' && (
                        <p className="text-xs text-green-500 mt-0.5">
                          Paid on {new Date(inv.paidAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-white">{fmt(inv.amount)}</p>
                      <div className={`flex items-center gap-1 mt-1 justify-end ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-xs font-medium">{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      <p className="text-xs text-zinc-600 text-center">
        Contact school admin to make a payment or dispute an invoice.
      </p>
    </div>
  );
}
