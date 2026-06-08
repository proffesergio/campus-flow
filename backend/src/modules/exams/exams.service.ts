import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type {
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateExamInput,
  UpdateExamInput,
  BulkGradeInput,
  ExamListQuery,
} from './exams.validator';

// ── Default BD grading scale (used when school has no custom thresholds) ──────
const DEFAULT_THRESHOLDS = [
  { min: 90, max: 100, label: 'A+' },
  { min: 80, max: 89.99, label: 'A' },
  { min: 70, max: 79.99, label: 'A-' },
  { min: 60, max: 69.99, label: 'B' },
  { min: 50, max: 59.99, label: 'C' },
  { min: 40, max: 49.99, label: 'D' },
  { min: 0, max: 39.99, label: 'F' },
];

async function computeGradeLabel(
  schoolId: string,
  percent: number,
): Promise<string> {
  const thresholds = await prisma.gradeThreshold.findMany({
    where: { schoolId },
    orderBy: { minPercent: 'desc' },
  });

  const list =
    thresholds.length > 0
      ? thresholds.map((t) => ({
          min: t.minPercent,
          max: t.maxPercent,
          label: t.label,
        }))
      : DEFAULT_THRESHOLDS;

  for (const t of list) {
    if (percent >= t.min && percent <= t.max) return t.label;
  }
  return 'F';
}

// ── Subjects ──────────────────────────────────────────────────────────────────

export async function listSubjects(schoolId: string, classId?: string) {
  return prisma.subject.findMany({
    where: { schoolId, ...(classId ? { classId } : {}) },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      _count: { select: { exams: true } },
    },
    orderBy: [{ name: 'asc' }],
  });
}

export async function createSubject(schoolId: string, data: CreateSubjectInput) {
  const classExists = await prisma.class.findFirst({
    where: { id: data.classId, schoolId },
  });
  if (!classExists) throw new AppError(404, 'Class not found');

  return prisma.subject.create({
    data: { schoolId, ...data },
    include: { teacher: { select: { firstName: true, lastName: true } } },
  });
}

export async function updateSubject(
  schoolId: string,
  id: string,
  data: UpdateSubjectInput,
) {
  const subject = await prisma.subject.findFirst({ where: { id, schoolId } });
  if (!subject) throw new AppError(404, 'Subject not found');

  return prisma.subject.update({ where: { id }, data });
}

export async function deleteSubject(schoolId: string, id: string) {
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { exams: true } } },
  });
  if (!subject) throw new AppError(404, 'Subject not found');
  if (subject._count.exams > 0)
    throw new AppError(409, 'Cannot delete subject with existing exams');

  await prisma.subject.delete({ where: { id } });
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export async function listExams(schoolId: string, query: ExamListQuery) {
  const { classId, subjectId, term, examType, upcoming, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    ...(classId ? { classId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(term ? { term } : {}),
    ...(examType ? { examType } : {}),
    // Upcoming = exams dated today or later, shown soonest-first.
    ...(upcoming ? { examDate: { gte: new Date() } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: {
        class: { select: { name: true, section: true } },
        subject: { select: { name: true, code: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { grades: true } },
      },
      orderBy: [{ examDate: upcoming ? 'asc' : 'desc' }],
      skip,
      take: limit,
    }),
    prisma.exam.count({ where }),
  ]);

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createExam(
  schoolId: string,
  userId: string,
  data: CreateExamInput,
) {
  const [classExists, subjectExists] = await Promise.all([
    prisma.class.findFirst({ where: { id: data.classId, schoolId } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, schoolId } }),
  ]);
  if (!classExists) throw new AppError(404, 'Class not found');
  if (!subjectExists) throw new AppError(404, 'Subject not found');
  if (data.passingMarks > data.totalMarks)
    throw new AppError(400, 'Passing marks cannot exceed total marks');

  return prisma.exam.create({
    data: { schoolId, createdById: userId, ...data, examDate: new Date(data.examDate) },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
    },
  });
}

export async function getExam(schoolId: string, id: string) {
  const exam = await prisma.exam.findFirst({
    where: { id, schoolId },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { grades: true } },
    },
  });
  if (!exam) throw new AppError(404, 'Exam not found');
  return exam;
}

export async function updateExam(
  schoolId: string,
  id: string,
  data: UpdateExamInput,
) {
  const exam = await prisma.exam.findFirst({ where: { id, schoolId } });
  if (!exam) throw new AppError(404, 'Exam not found');
  if (exam.isPublished)
    throw new AppError(409, 'Cannot edit a published exam — unpublish first');

  return prisma.exam.update({
    where: { id },
    data: { ...data, ...(data.examDate ? { examDate: new Date(data.examDate) } : {}) },
  });
}

export async function deleteExam(schoolId: string, id: string) {
  const exam = await prisma.exam.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { grades: true } } },
  });
  if (!exam) throw new AppError(404, 'Exam not found');
  if (exam._count.grades > 0)
    throw new AppError(409, 'Cannot delete exam with existing grades');

  await prisma.exam.delete({ where: { id } });
}

export async function publishExam(schoolId: string, id: string) {
  const exam = await prisma.exam.findFirst({ where: { id, schoolId } });
  if (!exam) throw new AppError(404, 'Exam not found');

  return prisma.exam.update({ where: { id }, data: { isPublished: !exam.isPublished } });
}

// ── Grades ────────────────────────────────────────────────────────────────────

export async function bulkSaveGrades(
  schoolId: string,
  graderId: string,
  data: BulkGradeInput,
) {
  const exam = await prisma.exam.findFirst({
    where: { id: data.examId, schoolId },
  });
  if (!exam) throw new AppError(404, 'Exam not found');

  const results = await Promise.all(
    data.grades.map(async (g) => {
      let gradeLabel: string | null = null;

      if (!g.isAbsent && g.marksObtained != null) {
        const percent = (g.marksObtained / exam.totalMarks) * 100;
        gradeLabel = await computeGradeLabel(schoolId, percent);
      }

      return prisma.grade.upsert({
        where: { examId_studentId: { examId: data.examId, studentId: g.studentId } },
        create: {
          schoolId,
          examId: data.examId,
          studentId: g.studentId,
          marksObtained: g.isAbsent ? null : (g.marksObtained ?? null),
          isAbsent: g.isAbsent,
          grade: gradeLabel,
          remarks: g.remarks ?? null,
          gradedById: graderId,
        },
        update: {
          marksObtained: g.isAbsent ? null : (g.marksObtained ?? null),
          isAbsent: g.isAbsent,
          grade: gradeLabel,
          remarks: g.remarks ?? null,
          gradedById: graderId,
        },
      });
    }),
  );

  return { saved: results.length };
}

export async function getExamGrades(schoolId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true } },
    },
  });
  if (!exam) throw new AppError(404, 'Exam not found');

  const [students, grades] = await Promise.all([
    prisma.student.findMany({
      where: { classId: exam.classId, schoolId, status: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        photoUrl: true,
      },
      orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.grade.findMany({
      where: { examId, schoolId },
    }),
  ]);

  const gradeMap = new Map(grades.map((g) => [g.studentId, g]));

  // Rank by marks — only students who sat the exam and have marks
  const ranked = [...grades]
    .filter((g) => !g.isAbsent && g.marksObtained != null)
    .sort((a, b) => (b.marksObtained ?? 0) - (a.marksObtained ?? 0));

  const rankMap = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i]!.marksObtained !== ranked[i - 1]!.marksObtained) {
      rank = i + 1;
    }
    rankMap.set(ranked[i]!.studentId, rank);
  }

  return {
    exam,
    students: students.map((s) => ({
      ...s,
      grade: gradeMap.get(s.id) ?? null,
      rank: rankMap.get(s.id) ?? null,
    })),
  };
}

export async function getStudentGrades(
  schoolId: string,
  studentId: string,
  term?: string,
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { class: { select: { name: true, section: true } } },
  });
  if (!student) throw new AppError(404, 'Student not found');

  const grades = await prisma.grade.findMany({
    where: {
      studentId,
      schoolId,
      ...(term ? { exam: { term } } : {}),
    },
    include: {
      exam: {
        select: {
          id: true,
          name: true,
          examType: true,
          examDate: true,
          totalMarks: true,
          passingMarks: true,
          term: true,
          subject: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { exam: { examDate: 'desc' } },
  });

  return { student, grades };
}

export async function getReportCardData(
  schoolId: string,
  studentId: string,
  term: string,
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: { class: { select: { name: true, section: true, academicYear: true } } },
  });
  if (!student) throw new AppError(404, 'Student not found');

  const grades = await prisma.grade.findMany({
    where: { studentId, schoolId, exam: { term } },
    include: {
      exam: {
        select: {
          id: true,
          name: true,
          examType: true,
          examDate: true,
          totalMarks: true,
          passingMarks: true,
          term: true,
          subject: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { exam: { examDate: 'asc' } },
  });

  // Class size for ranking
  const classSize = await prisma.student.count({
    where: { classId: student.classId, schoolId, status: 'active' },
  });

  // Overall stats
  const withMarks = grades.filter((g) => !g.isAbsent && g.marksObtained != null);
  const totalObtained = withMarks.reduce((s, g) => s + (g.marksObtained ?? 0), 0);
  const totalPossible = withMarks.reduce((s, g) => s + g.exam.totalMarks, 0);
  const overallPercent =
    totalPossible > 0 ? (totalObtained / totalPossible) * 100 : null;
  const overallGrade = overallPercent != null
    ? await computeGradeLabel(schoolId, overallPercent)
    : null;

  // Class rank (compared to classmates in same term)
  let classRank: number | null = null;
  if (overallPercent != null) {
    const classGrades = await prisma.grade.findMany({
      where: {
        schoolId,
        exam: { term, classId: student.classId },
        isAbsent: false,
        marksObtained: { not: null },
      },
      select: { studentId: true, marksObtained: true, exam: { select: { totalMarks: true } } },
    });

    // Aggregate per student
    const studentTotals = new Map<string, { obtained: number; possible: number }>();
    for (const g of classGrades) {
      const prev = studentTotals.get(g.studentId) ?? { obtained: 0, possible: 0 };
      studentTotals.set(g.studentId, {
        obtained: prev.obtained + (g.marksObtained ?? 0),
        possible: prev.possible + g.exam.totalMarks,
      });
    }

    const percents = [...studentTotals.entries()]
      .map(([sid, t]) => ({ sid, pct: t.possible > 0 ? (t.obtained / t.possible) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct);

    const idx = percents.findIndex((p) => p.sid === studentId);
    if (idx !== -1) classRank = idx + 1;
  }

  return {
    student,
    term,
    grades,
    summary: {
      totalObtained,
      totalPossible,
      overallPercent: overallPercent != null ? Math.round(overallPercent * 10) / 10 : null,
      overallGrade,
      classRank,
      classSize,
    },
  };
}
