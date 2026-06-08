import { prisma } from '../../config/prisma';
import {
  bucketGradeDistribution,
  buildAttendanceTrend,
  MonthAttendance,
} from './analytics.helpers';

export interface AtRiskOptions {
  attendanceThreshold?: number; // percent below which attendance is a concern
  gradeThreshold?: number;      // percent below which the average is failing
  windowDays?: number;          // attendance look-back window
}

export interface AtRiskStudent {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string | null;
    class: { name: string; section: string | null } | null;
  };
  attendanceRate: number | null;
  avgGrade: number | null;
  reasons: string[];
  level: 'high' | 'medium';
  score: number;
}

/**
 * Rule-based early-warning. Flags active students whose recent attendance or
 * average grade falls below configurable thresholds. Interpretable by design:
 * every flag carries human-readable reasons. (An ML model can replace the
 * scoring later without changing the API shape.)
 */
export async function getAtRiskStudents(schoolId: string, opts: AtRiskOptions = {}) {
  const attendanceThreshold = opts.attendanceThreshold ?? 75;
  const gradeThreshold = opts.gradeThreshold ?? 40;
  const windowDays = opts.windowDays ?? 60;

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const [students, attendance, grades] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId, status: 'active' },
      select: {
        id: true, firstName: true, lastName: true, rollNumber: true,
        class: { select: { name: true, section: true } },
      },
    }),
    prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: { schoolId, date: { gte: since } },
      _count: { _all: true },
    }),
    prisma.grade.findMany({
      where: { schoolId, isAbsent: false },
      select: { studentId: true, marksObtained: true, exam: { select: { totalMarks: true } } },
    }),
  ]);

  const att = new Map<string, { present: number; total: number }>();
  for (const a of attendance) {
    const m = att.get(a.studentId) ?? { present: 0, total: 0 };
    m.total += a._count._all;
    if (a.status === 'present' || a.status === 'late') m.present += a._count._all;
    att.set(a.studentId, m);
  }

  const grd = new Map<string, { sum: number; n: number }>();
  for (const g of grades) {
    if (g.marksObtained == null || !g.exam.totalMarks) continue;
    const pct = (g.marksObtained / g.exam.totalMarks) * 100;
    const m = grd.get(g.studentId) ?? { sum: 0, n: 0 };
    m.sum += pct;
    m.n += 1;
    grd.set(g.studentId, m);
  }

  const items: AtRiskStudent[] = [];
  for (const s of students) {
    const a = att.get(s.id);
    const attendanceRate = a && a.total > 0 ? Math.round((a.present / a.total) * 100) : null;
    const g = grd.get(s.id);
    const avgGrade = g && g.n > 0 ? Math.round(g.sum / g.n) : null;

    const reasons: string[] = [];
    let score = 0;

    if (attendanceRate != null && attendanceRate < attendanceThreshold) {
      reasons.push(`Low attendance (${attendanceRate}%)`);
      score += attendanceThreshold - attendanceRate;
    }
    if (avgGrade != null && avgGrade < gradeThreshold) {
      reasons.push(`Failing average (${avgGrade}%)`);
      score += (gradeThreshold - avgGrade) * 1.5;
    } else if (avgGrade != null && avgGrade < gradeThreshold + 10) {
      reasons.push(`Borderline grades (${avgGrade}%)`);
      score += (gradeThreshold + 10 - avgGrade) * 0.5;
    }

    if (reasons.length === 0) continue;

    const level: 'high' | 'medium' =
      (attendanceRate != null && attendanceRate < 60) || (avgGrade != null && avgGrade < gradeThreshold)
        ? 'high'
        : 'medium';

    items.push({ student: s, attendanceRate, avgGrade, reasons, level, score: Math.round(score) });
  }

  items.sort((a, b) => b.score - a.score);

  return {
    items,
    summary: {
      total: items.length,
      high: items.filter((i) => i.level === 'high').length,
      medium: items.filter((i) => i.level === 'medium').length,
    },
    thresholds: { attendanceThreshold, gradeThreshold, windowDays },
  };
}

function sixMonthsAgo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
}

/**
 * Aggregate data for the dashboard home: onboarding completion counts, grade
 * distribution across the school's grade thresholds, and a 6-month attendance
 * trend. All scoped to one school.
 */
export async function getDashboardSummary(schoolId: string) {
  const [classes, subjects, students, exams, thresholds, grades, attendance] = await Promise.all([
    prisma.class.count({ where: { schoolId } }),
    prisma.subject.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: 'active' } }),
    prisma.exam.count({ where: { schoolId } }),
    prisma.gradeThreshold.findMany({
      where: { schoolId },
      orderBy: { minPercent: 'desc' },
      select: { label: true, minPercent: true, maxPercent: true, color: true },
    }),
    prisma.grade.findMany({
      where: { schoolId, isAbsent: false, marksObtained: { not: null } },
      select: { marksObtained: true, exam: { select: { totalMarks: true } } },
    }),
    prisma.attendance.findMany({
      where: { schoolId, date: { gte: sixMonthsAgo() } },
      select: { date: true, status: true },
    }),
  ]);

  const percentages = grades
    .filter((g) => g.marksObtained != null && g.exam.totalMarks > 0)
    .map((g) => (g.marksObtained! / g.exam.totalMarks) * 100);

  const monthMap = new Map<string, { present: number; total: number }>();
  for (const a of attendance) {
    const key = a.date.toISOString().slice(0, 7); // YYYY-MM
    const m = monthMap.get(key) ?? { present: 0, total: 0 };
    m.total += 1;
    if (a.status === 'present' || a.status === 'late') m.present += 1;
    monthMap.set(key, m);
  }
  const attendanceRows: MonthAttendance[] = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, present: v.present, total: v.total }));

  return {
    onboarding: { classes, subjects, students, exams },
    gradeDistribution: bucketGradeDistribution(percentages, thresholds),
    attendanceTrend: buildAttendanceTrend(attendanceRows),
  };
}
