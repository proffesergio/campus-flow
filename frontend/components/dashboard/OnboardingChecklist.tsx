'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Rocket, Check, X } from 'lucide-react';
import { onboardingSteps, OnboardingCounts, OnboardingStep } from '@/lib/dashboard/helpers';

const DISMISS_KEY = 'cf_onboarding_dismissed';

const STEP_KEY_MAP: Record<OnboardingStep['key'], string> = {
  classes: 'stepClasses',
  subjects: 'stepSubjects',
  students: 'stepStudents',
  exams: 'stepExams',
};

export default function OnboardingChecklist({ counts }: { counts: OnboardingCounts }) {
  const t = useTranslations('dashboard');
  const [dismissed, setDismissed] = useState(
    typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1',
  );
  const steps = onboardingSteps(counts);
  const doneCount = steps.filter((s) => s.done).length;

  if (dismissed || doneCount === steps.length) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.12] to-blue-500/[0.03] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white inline-flex items-center gap-2">
          <Rocket className="w-4 h-4 text-blue-400" /> {t('onboardingTitle')}
          <span className="text-blue-400 font-medium">· {t('onboardingDone', { done: doneCount, total: steps.length })}</span>
        </p>
        <button onClick={dismiss} className="text-zinc-500 hover:text-zinc-300" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3 flex-wrap">
        {steps.map((s) =>
          s.done ? (
            <span key={s.key} className="inline-flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
              <Check className="w-3 h-3" /> {t(STEP_KEY_MAP[s.key])}
            </span>
          ) : (
            <Link key={s.key} href={s.href}
              className="inline-flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 py-1 transition-colors">
              → {t(STEP_KEY_MAP[s.key])}
            </Link>
          ),
        )}
      </div>
    </motion.div>
  );
}
