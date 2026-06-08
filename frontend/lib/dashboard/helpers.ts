export interface OnboardingCounts {
  classes: number;
  subjects: number;
  students: number;
  exams: number;
}

export interface OnboardingStep {
  key: keyof OnboardingCounts;
  label: string;
  href: string;
  done: boolean;
}

const STEP_DEFS: { key: keyof OnboardingCounts; label: string; href: string }[] = [
  { key: 'classes', label: 'Add classes', href: '/dashboard/classes' },
  { key: 'subjects', label: 'Add subjects', href: '/dashboard/subjects' },
  { key: 'students', label: 'Add students', href: '/dashboard/students' },
  { key: 'exams', label: 'Create first exam', href: '/dashboard/exams/new' },
];

export function onboardingSteps(counts: OnboardingCounts): OnboardingStep[] {
  return STEP_DEFS.map((d) => ({ ...d, done: (counts[d.key] ?? 0) > 0 }));
}

export type Direction = 'up' | 'down' | 'flat';

export function trendDirection(current: number, previous: number | null | undefined): Direction {
  if (previous == null) return 'flat';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

export function formatTaka(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '৳0';
  return `৳${Math.round(n).toLocaleString('en-US')}`;
}

export function formatCompact(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k % 1 === 0 || k >= 100 ? Math.round(k) : k.toFixed(1)}K`;
  }
  const m = value / 1_000_000;
  return `${m % 1 === 0 || m >= 100 ? Math.round(m) : m.toFixed(1)}M`;
}
