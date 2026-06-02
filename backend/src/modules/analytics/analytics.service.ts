import { prisma } from '../../config/prisma';

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
