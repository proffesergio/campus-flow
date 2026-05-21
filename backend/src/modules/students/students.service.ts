import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateStudentInput, UpdateStudentInput, StudentQuery } from './students.validator';

export async function listStudents(schoolId: string, query: StudentQuery) {
  const { page, limit, search, classId, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {
    schoolId,
    ...(classId && { classId }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { guardianPhone: { contains: search } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: { class: { select: { id: true, name: true, section: true } } },
      orderBy: [{ class: { name: 'asc' } }, { rollNumber: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.student.count({ where }),
  ]);

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getStudent(id: string, schoolId: string) {
  const student = await prisma.student.findFirst({
    where: { id, schoolId },
    include: {
      class: { select: { id: true, name: true, section: true, academicYear: true } },
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
    },
  });
  if (!student) throw new AppError(404, 'Student not found');
  return student;
}

export async function getStudentProfile(id: string, schoolId: string) {
  const student = await getStudent(id, schoolId);

  const [attendanceStats, recentGrades] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId: id, schoolId },
      _count: { status: true },
    }),
    prisma.grade.findMany({
      where: { studentId: id, schoolId },
      include: { exam: { select: { name: true, subject: true, totalMarks: true, term: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalAttendance = attendanceStats.reduce((sum, s) => sum + s._count.status, 0);
  const presentCount =
    attendanceStats.find((s) => s.status === 'present')?._count.status ?? 0;
  const attendancePercent =
    totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  return { ...student, attendancePercent, recentGrades };
}

export async function createStudent(schoolId: string, data: CreateStudentInput) {
  const classExists = await prisma.class.findFirst({ where: { id: data.classId, schoolId } });
  if (!classExists) throw new AppError(404, 'Class not found');

  const { createPortalAccess, portalEmail, ...studentData } = data;

  return prisma.$transaction(async (tx) => {
    let userId: string | undefined;

    if (createPortalAccess) {
      const email = portalEmail ?? `student.${crypto.randomBytes(4).toString('hex')}@${schoolId}.internal`;
      const tempPassword = crypto.randomBytes(6).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await tx.user.create({
        data: { schoolId, role: 'student', email, passwordHash, firstName: data.firstName, lastName: data.lastName },
      });
      userId = user.id;
    }

    return tx.student.create({
      data: {
        ...studentData,
        schoolId,
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : undefined,
        enrollmentDate: studentData.enrollmentDate ? new Date(studentData.enrollmentDate) : undefined,
        userId,
      },
      include: { class: { select: { id: true, name: true, section: true } } },
    });
  });
}

export async function updateStudent(id: string, schoolId: string, data: UpdateStudentInput) {
  const existing = await prisma.student.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Student not found');

  return prisma.student.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
    include: { class: { select: { id: true, name: true, section: true } } },
  });
}

export async function deleteStudent(id: string, schoolId: string) {
  const existing = await prisma.student.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Student not found');
  return prisma.student.update({ where: { id }, data: { status: 'inactive' } });
}

// ── Student self-service endpoints ───────────────────────────────────────────

export async function getMyRecord(userId: string, schoolId: string) {
  const student = await prisma.student.findFirst({
    where: { userId, schoolId },
    include: {
      class: { select: { id: true, name: true, section: true, academicYear: true } },
    },
  });
  if (!student) throw new AppError(404, 'No student record linked to this account');
  return student;
}

export async function getMyDashboard(userId: string, schoolId: string) {
  const student = await getMyRecord(userId, schoolId);

  const now = new Date();
  const [attGroups, pendingFees, upcomingExams, recentGrades, classRankData] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId: student.id, schoolId },
      _count: { status: true },
    }),
    prisma.invoice.aggregate({
      where: { studentId: student.id, schoolId, status: { in: ['pending', 'overdue'] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.exam.findMany({
      where: {
        schoolId,
        classId: student.classId,
        examDate: { gte: now },
        isPublished: true,
      },
      include: { subject: { select: { name: true } } },
      orderBy: { examDate: 'asc' },
      take: 5,
    }),
    prisma.grade.findMany({
      where: { studentId: student.id, schoolId },
      include: {
        exam: { include: { subject: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Class rank: count how many students scored higher than this student on average
    prisma.grade.groupBy({
      by: ['studentId'],
      where: { schoolId, exam: { classId: student.classId }, isAbsent: false },
      _avg: { marksObtained: true },
    }),
  ]);

  const total = attGroups.reduce((s, g) => s + g._count.status, 0);
  const present = attGroups.find((g) => g.status === 'present')?._count.status ?? 0;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : null;

  const myGrades = await prisma.grade.groupBy({
    by: ['studentId'],
    where: { studentId: student.id, schoolId, exam: { classId: student.classId }, isAbsent: false },
    _avg: { marksObtained: true },
  });
  const myAvg = myGrades[0]?._avg.marksObtained ?? 0;
  const rank = classRankData.filter((r) => (r._avg.marksObtained ?? 0) > myAvg).length + 1;
  const classSize = classRankData.length;

  return {
    student,
    attendancePct,
    pendingFeesAmount: Number(pendingFees._sum.amount ?? 0),
    pendingFeesCount: pendingFees._count.id,
    upcomingExams,
    recentGrades,
    classRank: rank,
    classSize,
  };
}

export async function getMyRanking(userId: string, schoolId: string, examId?: string) {
  const student = await getMyRecord(userId, schoolId);

  if (examId) {
    const allGrades = await prisma.grade.findMany({
      where: { examId, schoolId, isAbsent: false },
      orderBy: { marksObtained: 'desc' },
      select: { studentId: true, marksObtained: true },
    });
    const rank = allGrades.findIndex((g) => g.studentId === student.id) + 1;
    return { rank: rank || null, total: allGrades.length, examId };
  }

  // Overall rank in class
  const classRankData = await prisma.grade.groupBy({
    by: ['studentId'],
    where: { schoolId, exam: { classId: student.classId }, isAbsent: false },
    _avg: { marksObtained: true },
    orderBy: { _avg: { marksObtained: 'desc' } },
  });
  const rank = classRankData.findIndex((r) => r.studentId === student.id) + 1;
  return { rank: rank || null, total: classRankData.length };
}

export async function getStats(schoolId: string) {
  const [total, active, thisMonth] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.student.count({ where: { schoolId, status: 'active' } }),
    prisma.student.count({
      where: {
        schoolId,
        enrollmentDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);
  return { total, active, thisMonth };
}
