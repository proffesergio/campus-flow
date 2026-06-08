import { describe, it, expect } from 'vitest';
import { onboardingSteps, trendDirection, formatTaka, formatCompact } from './helpers';

describe('onboardingSteps', () => {
  it('marks a step done when its count > 0 and computes completion', () => {
    const steps = onboardingSteps({ classes: 2, subjects: 5, students: 0, exams: 0 });
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false]);
    expect(steps.filter((s) => s.done).length).toBe(2);
  });
  it('all done when every count > 0', () => {
    const steps = onboardingSteps({ classes: 1, subjects: 1, students: 1, exams: 1 });
    expect(steps.every((s) => s.done)).toBe(true);
  });
});

describe('trendDirection', () => {
  it('up when current > previous', () => expect(trendDirection(10, 8)).toBe('up'));
  it('down when current < previous', () => expect(trendDirection(8, 10)).toBe('down'));
  it('flat when equal or no previous', () => {
    expect(trendDirection(5, 5)).toBe('flat');
    expect(trendDirection(5, null)).toBe('flat');
  });
});

describe('formatTaka', () => {
  it('formats numbers with the taka sign and grouping', () => {
    expect(formatTaka(1200)).toBe('৳1,200');
    expect(formatTaka('0')).toBe('৳0');
    expect(formatTaka('abc')).toBe('৳0');
  });
});

describe('formatCompact', () => {
  it('shortens large numbers', () => {
    expect(formatCompact(1248)).toBe('1.2K');
    expect(formatCompact(840000)).toBe('840K');
    expect(formatCompact(50)).toBe('50');
  });
});
