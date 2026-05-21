import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { MarkAttendanceInput, AttendanceQuery } from './attendance.validator';

function toDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

export async function markAttendance(
  schoolId: string,
  markedById: string,
  data: MarkAttendanceInput,
) {
  const classExists = await prisma.class.findFirst({
    where: { id: data.classId, schoolId },
  });
  if (!classExists) throw new AppError(404, 'Class not found');

  const date = toDateOnly(data.date);

  const results = await Promise.all(
    data.records.map((record) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: record.studentId, date } },
        create: {
          schoolId,
          studentId: record.studentId,
          classId: data.classId,
          date,
          status: record.status,
          note: record.note,
          markedById,
        },
        update: {
          status: record.status,
          note: record.note,
          markedById,
        },
      }),
    ),
  );

  return {
    marked: results.filter((_, i) => !data.records[i]).length,
    updated: results.length,
    date: data.date,
    classId: data.classId,
  };
}

export async function getClassAttendance(
  schoolId: string,
  classId: string,
  dateStr: string,
) {
  const date = toDateOnly(dateStr);

  const [students, attendances] = await Promise.all([
    prisma.student.findMany({
      where: { classId, schoolId, status: 'active' },
      select: { id: true, firstName: true, lastName: true, rollNumber: true, photoUrl: true },
      orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.attendance.findMany({
      where: { classId, schoolId, date },
      include: { markedBy: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const attendanceMap = new Map(attendances.map((a) => [a.studentId, a]));

  return {
    date: dateStr,
    classId,
    isMarked: attendances.length > 0,
    markedBy: attendances[0]?.markedBy ?? null,
    students: students.map((s) => ({
      ...s,
      attendance: attendanceMap.get(s.id) ?? null,
    })),
  };
}

export async function getStudentHistory(
  schoolId: string,
  studentId: string,
  query: AttendanceQuery,
) {
  const { from, to, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    studentId,
    ...(from && to && {
      date: { gte: toDateOnly(from), lte: toDateOnly(to) },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        class: { select: { name: true, section: true } },
        markedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getMonthSummary(schoolId: string, classId: string, month: string) {
  const [year, mon] = month.split('-').map(Number);
  const from = new Date(Date.UTC(year!, mon! - 1, 1));
  const to = new Date(Date.UTC(year!, mon!, 0));

  const students = await prisma.student.findMany({
    where: { classId, schoolId, status: 'active' },
    select: { id: true, firstName: true, lastName: true, rollNumber: true },
    orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
  });

  const attendances = await prisma.attendance.findMany({
    where: { classId, schoolId, date: { gte: from, lte: to } },
    select: { studentId: true, status: true, date: true },
  });

  const byStudent = new Map<string, typeof attendances>();
  for (const a of attendances) {
    if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, []);
    byStudent.get(a.studentId)!.push(a);
  }

  return students.map((s) => {
    const records = byStudent.get(s.id) ?? [];
    const present = records.filter((r) => r.status === 'present').length;
    const total = records.length;
    return {
      ...s,
      present,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      excused: records.filter((r) => r.status === 'excused').length,
      total,
      percent: total > 0 ? Math.round((present / total) * 100) : null,
    };
  });
}

export async function getTodayStatus(schoolId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [classes, markedToday] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId },
      select: { id: true, name: true, section: true, _count: { select: { students: { where: { status: 'active' } } } } },
    }),
    prisma.attendance.groupBy({
      by: ['classId'],
      where: { schoolId, date: today },
      _count: { classId: true },
    }),
  ]);

  const markedSet = new Map(markedToday.map((m) => [m.classId, m._count.classId]));

  return classes.map((c) => ({
    ...c,
    markedCount: markedSet.get(c.id) ?? 0,
    isMarked: markedSet.has(c.id),
  }));
}
