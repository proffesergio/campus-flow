'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WizardStep { id: string; title: string; content: React.ReactNode }

export function Wizard({
  steps, onValidateStep, onSubmit, submitting, submitLabel = 'Save',
}: {
  steps: WizardStep[];
  onValidateStep: (stepId: string) => Promise<boolean> | boolean;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [i, setI] = React.useState(0);
  const last = i === steps.length - 1;

  async function next() {
    if (await onValidateStep(steps[i].id)) setI((n) => Math.min(n + 1, steps.length - 1));
  }
  async function finish() {
    // Validate every step, not just the visible one — otherwise an invalid field on
    // an earlier step makes submit silently no-op. Jump to the first failing step.
    for (let s = 0; s < steps.length; s++) {
      if (!(await onValidateStep(steps[s].id))) { setI(s); return; }
    }
    onSubmit();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                idx < i ? 'bg-blue-600 text-white'
                  : idx === i ? 'bg-blue-600/20 text-blue-400 border border-blue-500'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {idx < i ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <span className={`text-xs hidden sm:inline ${idx === i ? 'text-white' : 'text-zinc-500'}`}>{s.title}</span>
            </div>
            {idx < steps.length - 1 && <div className="flex-1 h-px bg-zinc-800" />}
          </React.Fragment>
        ))}
      </div>

      <div>{steps[i].content}</div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" disabled={i === 0 || submitting}
          onClick={() => setI((n) => Math.max(n - 1, 0))} className="text-zinc-400">Back</Button>
        {last ? (
          <Button type="button" onClick={finish} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitLabel}
          </Button>
        ) : (
          <Button type="button" onClick={next} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">Next →</Button>
        )}
      </div>
    </div>
  );
}
