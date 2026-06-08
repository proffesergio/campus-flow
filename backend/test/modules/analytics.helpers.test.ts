import { bucketGradeDistribution, buildAttendanceTrend } from '../../src/modules/analytics/analytics.helpers';

describe('bucketGradeDistribution', () => {
  const thresholds = [
    { label: 'A+', minPercent: 80, maxPercent: 100, color: '#16a34a' },
    { label: 'B', minPercent: 60, maxPercent: 79.99, color: '#eab308' },
    { label: 'F', minPercent: 0, maxPercent: 59.99, color: '#991b1b' },
  ];

  it('counts each percentage into its threshold bucket', () => {
    const result = bucketGradeDistribution([95, 82, 70, 40], thresholds);
    expect(result).toEqual([
      { label: 'A+', count: 2, color: '#16a34a' },
      { label: 'B', count: 1, color: '#eab308' },
      { label: 'F', count: 1, color: '#991b1b' },
    ]);
  });

  it('returns zero counts when there are no grades', () => {
    const result = bucketGradeDistribution([], thresholds);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });
});

describe('buildAttendanceTrend', () => {
  it('computes present-percentage per month key', () => {
    const rows = [
      { month: '2026-01', present: 90, total: 100 },
      { month: '2026-02', present: 47, total: 50 },
    ];
    expect(buildAttendanceTrend(rows)).toEqual([
      { month: '2026-01', percent: 90 },
      { month: '2026-02', percent: 94 },
    ]);
  });

  it('reports 0 percent for a month with no records', () => {
    expect(buildAttendanceTrend([{ month: '2026-03', present: 0, total: 0 }])).toEqual([
      { month: '2026-03', percent: 0 },
    ]);
  });
});
