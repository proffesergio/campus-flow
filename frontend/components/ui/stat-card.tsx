'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ACCENTS, AccentName, SURFACE, fadeUp } from '@/lib/design/tokens';
import type { Direction } from '@/lib/dashboard/helpers';

export function StatCard({
  label, value, icon: Icon, accent = 'blue', trend, hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: AccentName;
  trend?: { direction: Direction; text: string };
  hint?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.div variants={fadeUp} className={`${SURFACE} p-4`}>
      <div className="flex items-start justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.bg}`}>
          <Icon className={`w-4 h-4 ${a.text}`} />
        </span>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 inline-flex items-center gap-1 ${
          trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-zinc-500'
        }`}>
          {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend.text}
        </p>
      )}
      {hint && !trend && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </motion.div>
  );
}
