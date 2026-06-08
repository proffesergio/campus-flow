export interface GradeThresholdLite {
  label: string;
  minPercent: number;
  maxPercent: number;
  color: string;
}

export interface GradeBucket {
  label: string;
  count: number;
  color: string;
}

/** Count each percentage into the threshold band whose [min,max] contains it. */
export function bucketGradeDistribution(
  percentages: number[],
  thresholds: GradeThresholdLite[],
): GradeBucket[] {
  const buckets = thresholds.map((t) => ({ label: t.label, count: 0, color: t.color }));
  for (const pct of percentages) {
    const idx = thresholds.findIndex((t) => pct >= t.minPercent && pct <= t.maxPercent);
    if (idx >= 0) buckets[idx].count += 1;
  }
  return buckets;
}

export interface MonthAttendance {
  month: string; // 'YYYY-MM'
  present: number;
  total: number;
}

export interface AttendancePoint {
  month: string;
  percent: number;
}

/** Convert raw monthly present/total counts into rounded present-percentages. */
export function buildAttendanceTrend(rows: MonthAttendance[]): AttendancePoint[] {
  return rows.map((r) => ({
    month: r.month,
    percent: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
  }));
}
